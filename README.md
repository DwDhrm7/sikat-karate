# SIKAT — Sistem Ujian Kenaikan Tingkat

Digitalisasi ujian kenaikan tingkat karate: pendaftaran, verifikasi berkas dan
pembayaran, penerbitan nomor dada, penilaian di tablet, sampai pencetakan hasil.

## Menjalankan

```bash
npm install
cp .env.example .env.local     # lalu isi nilainya
npm run dev
```

`.env.local` wajib berisi `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY`.
Yang terakhir hanya dipakai kontingen untuk membuat akun dojo dan penguji, dan
tidak boleh menyentuh kode klien.

## Database

Migrasi ditulis tangan di `supabase/migrations/`, dijalankan berurutan menurut
nama berkas. `supabase/seed.sql` mengisi data pengembangan: 1 event, 5 tingkat,
3 dojo, dan 329 peserta — 220 di antaranya di tingkat PK supaya tabel penilaian
teruji pada beban sebenarnya.

Diagram relasi, aturan transisi status, dan ringkasan RLS ada di
[docs/skema.md](docs/skema.md).

## Akun uji

Kata sandi semuanya `sikat123`.

| Email | Peran |
|---|---|
| `kontingen@sikat.test` | kontingen |
| `dojo.bky@sikat.test` | dojo Bina Karya |
| `dojo.grs@sikat.test` | dojo Garuda Sakti |
| `dojo.tnm@sikat.test` | dojo Tunas Muda |
| `penguji1@sikat.test` | penguji, PK 1–110 |
| `penguji2@sikat.test` | penguji, PK 111–220 |
| `penguji3@sikat.test` | penguji tanpa tugas (untuk menguji RLS) |
| `peserta1@sikat.test` | peserta, sudah terverifikasi (berkas terkunci) |
| `peserta2@sikat.test` | peserta, belum mendaftar sama sekali |

Akun-akun ini dibuat langsung lewat SQL, jadi domain `.test`-nya lolos. Supabase
Auth menolak domain tak terkirim pada pendaftaran mandiri — lihat catatan di
bawah.

## Menguji sebagai peran tertentu

```bash
node scripts/sesi-uji.mjs penguji1@sikat.test sikat123
curl -H "Cookie: $(node scripts/sesi-uji.mjs penguji1@sikat.test sikat123)" \
     http://localhost:3000/penguji
```

Untuk menguji keserentakan penerbitan nomor dada, jalankan
`supabase/tests/uji_nomor_dada.sql` dari tiga koneksi database sekaligus.

## Warna

Palet diambil dari lambang KKI: merah bendera `#CE1126`, hitam `#141414`,
putih. Hitam memikul tombol aksi utama; merah disimpan untuk identitas,
penanda nilai yang diubah, dan aksi berbahaya — supaya merah tetap terbaca
sebagai "hati-hati" alih-alih jadi warna latar biasa. Tokennya ada di
`src/app/globals.css` sebagai `--merek`, `--merek-foreground`, dan
`--merek-lembut`.

Simpan lambangnya sebagai `public/logo-kki.png`; komponen `LogoKKI` otomatis
memakainya begitu berkas itu ada, dan menampilkan penanda sementara bila belum.

## Pembuatan akun

Akun dojo dan penguji dibuat kontingen lewat `/kontingen/akun`, memakai
`supabase.auth.admin.createUser` dengan service_role — satu-satunya tempat di
aplikasi ini yang memakai kunci itu, karena membuat pengguna lain memang
mustahil lewat RLS. Peran diberikan setelah akun jadi; `handle_new_user()`
selalu memberi `peserta` lebih dulu, apa pun yang dikirim pendaftar.

## Uji ujung-ke-ujung

```bash
npm run e2e          # seluruh rangkaian, viewport tablet 1180×820
npm run e2e:ui       # mode interaktif
```

Rangkaian ini menjalankan halaman penilaian di peramban sungguhan: menekan
tombol +/−, numpad, toggle kehadiran, memutus jaringan untuk menguji antrean
offline, dan memastikan indikator tidak pernah mengaku "tersimpan" sebelum
server mengonfirmasi. Proyek `bersihkan` mengembalikan data penilaian ke
keadaan awal sebelum rangkaian jalan, supaya putaran kedua tidak mewarisi
nilai putaran pertama.

Playwright memakai server dev yang sudah berjalan bila ada, karena Next 16
menolak menjalankan dua dev server untuk direktori yang sama. Atur port lain
lewat `PORT_UJI` bila perlu.

## Catatan

- Next 16 mengganti `middleware.ts` menjadi `proxy.ts` dengan runtime Node.
  Proxy hanya memeriksa "sudah login atau belum"; keputusan peran diambil di
  layout, dan pagar terakhirnya tetap RLS di database.
- Supabase Auth menolak alamat berdomain tak terkirim (`.test`, `example.com`)
  pada pendaftaran mandiri. Untuk menguji alur peserta, pakai domain email asli
  atau buat akunnya lewat service_role.
- Variabel `NEXT_PUBLIC_*` hanya diganti Next saat kompilasi bila disebut
  sebagai rujukan statis, misalnya `process.env.NEXT_PUBLIC_SUPABASE_URL`.
  Membacanya lewat kunci dinamis (`process.env[nama]`) lolos dari penggantian
  dan menghasilkan `undefined` di peramban, sementara di server tetap jalan —
  lihat `src/lib/supabase/env.ts`.
