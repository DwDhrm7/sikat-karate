# Skema Database SIKAT

## Diagram relasi

```
auth.users ─┬─1:1─> profiles ──N:1──> dojo
            │         peran: peserta | dojo | penguji | kontingen
            │         dojo_id wajib bila peran = 'dojo'
            │
            ├─0:N─> peserta.user_id          (nullable: dojo boleh mendaftarkan)
            ├─0:N─> peserta.didaftarkan_oleh
            ├─0:N─> penguji_tugas.penguji_user_id
            ├─0:N─> penilaian.penguji_user_id
            └─0:N─> audit_log.aktor_id

event_ujian ──1:N──> tingkat
     │                  │  kode (PK/KH/HB/BT/CH), biaya, nilai_bawaan,
     │                  │  batas_lulus, hasil_ditutup
     │                  │
     │                  ├──1:N──> peserta          ┐
     │                  ├──1:N──> batch_dojo       │ ketiganya memakai FK
     │                  ├──1:N──> penguji_tugas    │ gabungan (tingkat_id,
     │                  └──1:1──> counter_nomor    ┘ event_id) agar tingkat
     │                                               mustahil berasal dari
     └──1:N──> peserta                               event yang berbeda

dojo ──1:N──> peserta
  └──1:N──> batch_dojo

peserta ─┬─1:N─> berkas_peserta    (unik per jenis)
         ├─1:1─> pembayaran
         └─1:1─> penilaian
```

## Kunci dan jaring pengaman

| Batasan | Tabel | Alasan |
|---|---|---|
| `UNIQUE (event_id, tingkat_id, no_dada)` | peserta | jaring pengaman terakhir kalau logika penomoran bocor |
| `UNIQUE (event_id, tingkat_id, no_urut)` | peserta | sama, untuk bentuk angkanya |
| `CHECK ((no_urut IS NULL) = (no_dada IS NULL))` | peserta | nomor dan bentuk teksnya selalu terbit bersamaan |
| `CHECK` status lanjut wajib bernomor | peserta | mustahil `layak_ujian` tanpa nomor dada |
| `UNIQUE (event_id, user_id) WHERE user_id IS NOT NULL` | peserta | satu akun, satu tingkat, per event |
| `FK (tingkat_id, event_id)` | peserta, batch_dojo, penguji_tugas, counter_nomor | tingkat tidak bisa menyeberang event |
| `UNIQUE (peserta_id, jenis)` | berkas_peserta | satu berkas per jenis |
| `UNIQUE (peserta_id)` | pembayaran, penilaian | satu pembayaran dan satu nilai per peserta |
| `CHECK` alasan wajib saat ditolak | berkas_peserta, pembayaran | penolakan tanpa alasan tidak mungkin tersimpan |

## Dua kolom nomor, bukan satu

`no_dada` menyimpan bentuk yang dibaca manusia (`PK-014`), `no_urut` menyimpan
angkanya (`14`). Rentang tugas penguji dibandingkan terhadap `no_urut` sebagai
bilangan. Kalau perbandingan dilakukan atas teks, `PK-99` akan terhitung lebih
besar daripada `PK-100`, dan penguji akan kehilangan peserta di lapangan.

## Alur status peserta

```
draft ──> menunggu_verifikasi ──> terverifikasi ──> layak_ujian ──> dinilai ──> lulus
             │         ^                                                    └─> tidak_lulus
             v         │
          ditolak ─────┘

* ──> batal   (nomor dada yang sudah terbit tidak pernah didaur ulang)
```

Dijaga trigger `jaga_transisi_status()`. Peran yang boleh melakukan tiap
transisi diperiksa di sana, bukan di kode aplikasi:

| Transisi | Pelaku |
|---|---|
| `draft`/`ditolak` → `menunggu_verifikasi` | peserta atau dojo |
| `menunggu_verifikasi` → `terverifikasi` / `ditolak` | dojo |
| `terverifikasi` → `layak_ujian` | hanya `terbitkan_nomor_dada()` |
| `layak_ujian` → `dinilai` | penguji |
| `dinilai` → `lulus` / `tidak_lulus` | kontingen |
| apa pun → `batal` | dojo |

Kontingen boleh melompati aturan ini, tetapi setiap lompatannya tercatat di
`audit_log`.

## Penerbitan nomor dada

`terbitkan_nomor_dada(event_id, tingkat_id, dojo_id)` — SECURITY DEFINER.

1. Periksa peran pemanggil: kontingen, atau dojo atas dojonya sendiri.
2. Tolak kalau hasil tingkat sudah ditutup atau event sudah selesai.
3. `SELECT ... FOR UPDATE` pada baris `counter_nomor`. **Ini titik
   serialisasinya** — dua dojo yang menekan Kunci Batch bersamaan akan antre.
4. Hitung peserta `terverifikasi` yang belum bernomor di dojo itu.
5. Bagikan satu blok berurutan, diurutkan menurut nama, lalu naikkan counter.
6. Catat batch dan tulis satu baris ringkasan ke `audit_log`.

Diuji dengan tiga koneksi serentak pada tingkat HB: 25 nomor, seluruhnya unik,
1–25 tanpa bolong, tiap dojo menempati blok yang rapat.

## Penguncian berkas

`boleh_ubah_berkas()` membatasi siapa yang boleh menyentuh berkas dan
pembayaran, dan kapan. Peserta hanya boleh selama statusnya `draft`,
`ditolak`, atau `menunggu_verifikasi`; sesudah dojo menerimanya, berkas
terkunci. Dojo dan kontingen tidak dibatasi status. Aturan yang sama dipakai
pada policy `storage.objects`, jadi mengunggah langsung ke Storage pun ikut
tertutup.

Dibuktikan dengan pengujian: setelah status jadi `terverifikasi`, unggahan
peserta ditolak HTTP 400 dan UPDATE barisnya mengubah 0 baris, sementara
unggahan dojo tetap berhasil HTTP 200.

## Verifikasi borongan

`verifikasi_massal(p_peserta_ids uuid[])` menerima seluruh centangan dalam
satu panggilan. Dojo menyetujui ratusan peserta sekaligus; kalau itu dikirim
sebagai ratusan permintaan, satu koneksi putus di tengah meninggalkan separuh
peserta terverifikasi dan separuh tidak.

Fungsi ini menyaring sendiri mana yang layak — milik dojo pemanggil, berstatus
`menunggu_verifikasi`, berkas wajibnya lengkap, bukti transfernya ada — lalu
mengembalikan `(diproses, dilewati)`. Yang tidak layak dilewati diam-diam,
bukan menggagalkan seluruh kiriman, supaya satu peserta bermasalah tidak
menahan 99 lainnya.

`tolak_peserta(p_peserta_id, p_alasan, p_jenis_ditolak[], p_tolak_pembayaran)`
menandai berkas yang bermasalah saja, menyetel `peserta.catatan`, dan
mengembalikan status ke `ditolak`. Alasan kosong ditolak fungsi ini, bukan
hanya oleh formulir.

## Cakupan rentang penguji

`cek_cakupan_penguji(p_tingkat_id)` membandingkan nomor 1..maks dengan seluruh
rentang penugasan, lalu melaporkan pulau-pulau yang cacah pengujinya bukan 1:
`kosong` untuk nomor yang tidak dipegang siapa pun, `tumpang_tindih` untuk yang
dipegang lebih dari satu.

Tumpang tindih sengaja tidak dilarang di level database. Kontingen kadang
memang perlu menambah penguji kedua pada rentang yang sibuk; yang berbahaya
adalah tidak menyadarinya, bukan melakukannya. Jadi database mengizinkan,
dashboard memperingatkan.

## Penyimpanan nilai

`simpan_penilaian(p_items jsonb)` menerima seluruh perubahan sebagai satu
array. Seratus sepuluh baris berangkat dalam satu permintaan, bukan seratus
sepuluh permintaan — di lapangan bersinyal buruk, jumlah perjalanan jaringan
jauh lebih menentukan daripada ukuran muatan.

Fungsi ini mengembalikan **daftar peserta_id yang benar-benar tersimpan**,
bukan sekadar jumlahnya. Klien memakai daftar itu untuk menandai baris mana
yang sudah dikonfirmasi; yang tidak ikut kembali tetap tinggal di antrean.
Dengan begitu tidak ada baris yang mengaku tersimpan hanya karena permintaan
tidak menghasilkan galat.

Item yang dilewati: peserta di luar rentang tugas pemanggil, tingkat yang
hasilnya sudah ditutup, nilai di luar 0–100, dan baris yang `dikunci`.
Kiriman ganda untuk peserta yang sama diselesaikan dengan aturan "yang
terakhir menang", supaya antrean yang menumpuk tidak menimbulkan galat
konflik.

## Row Level Security

| Peran | Yang terlihat |
|---|---|
| Peserta | barisnya sendiri; nilai hanya setelah `tingkat.hasil_ditutup` |
| Dojo | peserta dengan `dojo_id` miliknya, beserta berkas dan pembayarannya |
| Penguji | peserta pada tingkat yang ditugaskan, **di dalam rentang nomornya**, dan berstatus `layak_ujian`/`dinilai`. Tidak ada akses ke berkas maupun pembayaran. |
| Kontingen | seluruhnya |

Bukti dari pengujian langsung di database (menyamar sebagai tiap peran):

| Skenario | Hasil |
|---|---|
| penguji1 (tugas PK 1–110) | 110 peserta, nomor 1–110, 1 tingkat, 0 berkas, 0 pembayaran, 0 audit |
| penguji3 (tanpa tugas) | 0 peserta, 0 tugas, 0 berkas |
| dojo BKY | 176 peserta, semuanya 1 dojo, 0 audit, 0 counter |
| dojo mengunci batch dojo lain | ditolak 42501 |
| dojo menaikkan perannya sendiri | ditolak 42501 |
| dojo melompat `layak_ujian` → `lulus` | ditolak 42501 |
| penguji mengubah nama 200 peserta | 0 baris berubah |
