-- =====================================================================
-- SIKAT — Data pengembangan
--
-- Berisi 1 event, 5 tingkat, 3 dojo, dan 235 peserta di tingkat PK
-- (220 di antaranya sampai ke tahap layak ujian) supaya tabel penilaian
-- penguji diuji pada beban yang sebenarnya, bukan pada sepuluh baris.
--
-- Kata sandi semua akun uji: sikat123
--
-- CATATAN: berkas ini hanya menerbitkan nomor dada untuk tingkat PK.
-- Tingkat KH, BT, dan CH sengaja dibiarkan batchnya terbuka supaya alur
-- Kunci Batch bisa diuji manual. Pada database pengembangan yang aktif,
-- tingkat HB sudah ikut bernomor karena dipakai menguji keserentakan
-- (lihat tests/uji_nomor_dada.sql).
-- =====================================================================

set session sikat.lewati_audit = 'on';

-- ------------------------------------------------------------------
-- Pembuat akun uji. Dibuang lagi di akhir berkas ini.
-- ------------------------------------------------------------------
create or replace function public.seed_buat_user(
  p_email    text,
  p_password text,
  p_nama     text
) returns uuid
language plpgsql
as $fn$
declare
  v_id uuid := gen_random_uuid();
begin
  select id into v_id from auth.users where email = p_email;
  if found then
    return v_id;
  end if;

  v_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    p_email, extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nama', p_nama), now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  return v_id;
end;
$fn$;

-- ------------------------------------------------------------------
-- Master: dojo, event, tingkat
-- ------------------------------------------------------------------
insert into public.dojo (id, nama, kode, kota, nama_ketua) values
  ('33333333-3333-3333-3333-000000000001', 'Dojo Bina Karya',   'BKY', 'Denpasar', 'Sensei Wayan Sudira'),
  ('33333333-3333-3333-3333-000000000002', 'Dojo Garuda Sakti', 'GRS', 'Gianyar',  'Sensei Made Suparta'),
  ('33333333-3333-3333-3333-000000000003', 'Dojo Tunas Muda',   'TNM', 'Tabanan',  'Sensei Ketut Arimbawa')
on conflict (id) do nothing;

insert into public.event_ujian (id, nama, tanggal, lokasi, status) values
  ('11111111-1111-1111-1111-111111111111',
   'Ujian Kenaikan Tingkat Gelombang I 2026',
   '2026-11-15', 'GOR Lila Bhuana, Denpasar', 'pendaftaran_dibuka')
on conflict (id) do nothing;

insert into public.tingkat
  (id, event_id, kode, nama, sabuk_asal, sabuk_tujuan, biaya, nilai_bawaan, batas_lulus, urutan, wajib_sertifikat_terakhir)
values
  ('22222222-2222-2222-2222-000000000001', '11111111-1111-1111-1111-111111111111',
   'PK', 'Putih ke Kuning',   'Putih',   'Kuning',  150000, 80, 60, 1, false),
  ('22222222-2222-2222-2222-000000000002', '11111111-1111-1111-1111-111111111111',
   'KH', 'Kuning ke Hijau',   'Kuning',  'Hijau',   175000, 80, 60, 2, true),
  ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-111111111111',
   'HB', 'Hijau ke Biru',     'Hijau',   'Biru',    200000, 78, 65, 3, true),
  ('22222222-2222-2222-2222-000000000004', '11111111-1111-1111-1111-111111111111',
   'BT', 'Biru ke Cokelat',   'Biru',    'Cokelat', 250000, 78, 65, 4, true),
  ('22222222-2222-2222-2222-000000000005', '11111111-1111-1111-1111-111111111111',
   'CH', 'Cokelat ke Hitam (DAN I)', 'Cokelat', 'Hitam', 500000, 75, 70, 5, true)
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- Akun uji dan perannya
-- ------------------------------------------------------------------
do $seed$
declare
  v_kontingen uuid;
  v_dojo1     uuid;
  v_dojo2     uuid;
  v_dojo3     uuid;
  v_penguji1  uuid;
  v_penguji2  uuid;
  v_penguji3  uuid;
begin
  v_kontingen := public.seed_buat_user('kontingen@sikat.test', 'sikat123', 'Panitia Kontingen');
  v_dojo1     := public.seed_buat_user('dojo.bky@sikat.test',  'sikat123', 'Admin Dojo Bina Karya');
  v_dojo2     := public.seed_buat_user('dojo.grs@sikat.test',  'sikat123', 'Admin Dojo Garuda Sakti');
  v_dojo3     := public.seed_buat_user('dojo.tnm@sikat.test',  'sikat123', 'Admin Dojo Tunas Muda');
  v_penguji1  := public.seed_buat_user('penguji1@sikat.test',  'sikat123', 'Sensei Nyoman Gunawan');
  v_penguji2  := public.seed_buat_user('penguji2@sikat.test',  'sikat123', 'Sensei Luh Ratna');
  v_penguji3  := public.seed_buat_user('penguji3@sikat.test',  'sikat123', 'Sensei Kadek Prabawa');

  update public.profiles set peran = 'kontingen' where id = v_kontingen;
  update public.profiles set peran = 'dojo', dojo_id = '33333333-3333-3333-3333-000000000001' where id = v_dojo1;
  update public.profiles set peran = 'dojo', dojo_id = '33333333-3333-3333-3333-000000000002' where id = v_dojo2;
  update public.profiles set peran = 'dojo', dojo_id = '33333333-3333-3333-3333-000000000003' where id = v_dojo3;
  update public.profiles set peran = 'penguji' where id in (v_penguji1, v_penguji2, v_penguji3);
end;
$seed$;

-- ------------------------------------------------------------------
-- Peserta
--
-- PK  : 220 siap ujian + 15 yang masih tersangkut di verifikasi
-- KH  : 40, HB : 25, BT : 12, CH : 6  (semua terverifikasi, batch
--       sengaja belum dikunci supaya alur Fase 4 bisa diuji manual)
-- ------------------------------------------------------------------
do $seed$
declare
  v_depan text[] := array[
    'Gede','Made','Komang','Ketut','Wayan','Putu','Kadek','Nyoman','Luh','Ayu',
    'Agus','Dewi','Bagus','Sari','Eka','Dwi','Tri','Catur','Panca','Sadu'];
  v_tengah text[] := array[
    'Adi','Bayu','Candra','Dharma','Eka','Fajar','Galih','Harta','Indra','Jaya',
    'Karma','Lestari','Mahendra','Nugraha','Oka','Pradnya','Rai','Surya','Teja','Wira'];
  v_belakang text[] := array[
    'Santika','Wirawan','Pratama','Kusuma','Nugroho','Saputra','Mahardika','Anggara',
    'Permana','Wijaya','Sanjaya','Darmawan','Prasetya','Handika','Yudistira'];

  v_event uuid := '11111111-1111-1111-1111-111111111111';
  v_dojo  uuid[] := array[
    '33333333-3333-3333-3333-000000000001'::uuid,
    '33333333-3333-3333-3333-000000000002'::uuid,
    '33333333-3333-3333-3333-000000000003'::uuid];

  v_tingkat_id   uuid;
  v_biaya        integer;
  v_wajib_sert   boolean;
  v_status       public.status_peserta;
  v_peserta_id   uuid;
  v_nama         text;
  v_dojo_id      uuid;
  i              integer;
  b              integer;

  -- kode tingkat, jumlah peserta siap ujian, jumlah peserta tersangkut
  v_kode  text[]    := array['PK','KH','HB','BT','CH'];
  v_siap  integer[] := array[220, 40, 25, 12, 6];
  v_macet integer[] := array[15, 5, 3, 2, 1];
  k integer;
begin
  for k in 1 .. array_length(v_kode, 1) loop
    select t.id, t.biaya, t.wajib_sertifikat_terakhir
      into v_tingkat_id, v_biaya, v_wajib_sert
    from public.tingkat t
    where t.event_id = v_event and t.kode = v_kode[k];

    for i in 1 .. (v_siap[k] + v_macet[k]) loop
      v_nama := v_depan[1 + ((i * 7 + k) % array_length(v_depan, 1))] || ' ' ||
                v_tengah[1 + ((i * 11 + k) % array_length(v_tengah, 1))] || ' ' ||
                v_belakang[1 + ((i * 13 + k) % array_length(v_belakang, 1))];

      -- Dojo dibagi tiga kelompok yang tidak rata, seperti kenyataannya
      v_dojo_id := case
        when i % 5 = 0 then v_dojo[3]
        when i % 3 = 0 then v_dojo[2]
        else v_dojo[1]
      end;

      if i <= v_siap[k] then
        v_status := 'terverifikasi';
      else
        b := i - v_siap[k];
        v_status := case (b % 3)
          when 0 then 'draft'
          when 1 then 'menunggu_verifikasi'
          else 'ditolak'
        end;
      end if;

      insert into public.peserta (
        event_id, tingkat_id, dojo_id, nama_lengkap, tgl_lahir,
        jenis_kelamin, sabuk_sekarang, status, catatan
      ) values (
        v_event, v_tingkat_id, v_dojo_id, v_nama,
        date '2010-01-01' + ((i * 37) % 2500),
        case when i % 2 = 0 then 'L'::public.jenis_kelamin else 'P'::public.jenis_kelamin end,
        (select sabuk_asal from public.tingkat where id = v_tingkat_id),
        v_status,
        case when v_status = 'ditolak' then 'Pas foto buram, mohon unggah ulang' end
      )
      returning id into v_peserta_id;

      -- Berkas
      insert into public.berkas_peserta (peserta_id, jenis, path_storage, status, alasan_tolak, diverifikasi_pada)
      select v_peserta_id, j.jenis, v_peserta_id::text || '/' || j.jenis::text || '.jpg',
             case
               when v_status in ('terverifikasi') then 'diterima'::public.status_berkas
               when v_status = 'ditolak' and j.jenis = 'pas_foto' then 'ditolak'::public.status_berkas
               else 'menunggu'::public.status_berkas
             end,
             case when v_status = 'ditolak' and j.jenis = 'pas_foto'
                  then 'Pas foto buram, mohon unggah ulang' end,
             case when v_status = 'terverifikasi' then now() end
      from (
        select unnest(
          case when v_wajib_sert
               then array['pas_foto','akta_atau_kk','surat_sehat','sertifikat_terakhir']
               else array['pas_foto','akta_atau_kk','surat_sehat']
          end
        )::public.jenis_berkas as jenis
      ) j
      where v_status <> 'draft';

      -- Pembayaran
      insert into public.pembayaran (peserta_id, jumlah, path_bukti, status, diverifikasi_pada)
      select v_peserta_id, v_biaya,
             v_peserta_id::text || '/bukti-transfer.jpg',
             case when v_status = 'terverifikasi' then 'lunas'::public.status_pembayaran
                  else 'menunggu'::public.status_pembayaran end,
             case when v_status = 'terverifikasi' then now() end
      where v_status <> 'draft';
    end loop;
  end loop;
end;
$seed$;

-- ------------------------------------------------------------------
-- Penerbitan nomor dada untuk tingkat PK.
--
-- Dijalankan lewat terbitkan_nomor_dada() persis seperti dojo akan
-- melakukannya, bukan lewat UPDATE manual — sekalian membuktikan
-- fungsinya bekerja. Tingkat lain sengaja dibiarkan terbuka.
-- ------------------------------------------------------------------
do $seed$
declare
  v_kontingen uuid;
  v_dojo_id   uuid;
  v_hasil     record;
begin
  select id into v_kontingen from auth.users where email = 'kontingen@sikat.test';

  -- Menyamar sebagai kontingen supaya pemeriksaan peran di dalam fungsi
  -- benar-benar dilalui, bukan dilewati
  perform set_config('request.jwt.claims', json_build_object('sub', v_kontingen)::text, false);

  foreach v_dojo_id in array array[
    '33333333-3333-3333-3333-000000000001'::uuid,
    '33333333-3333-3333-3333-000000000002'::uuid,
    '33333333-3333-3333-3333-000000000003'::uuid]
  loop
    select * into v_hasil from public.terbitkan_nomor_dada(
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-000000000001',
      v_dojo_id
    );
    raise notice 'Dojo % menerima % nomor (% s/d %)',
      v_dojo_id, v_hasil.jumlah, v_hasil.no_awal, v_hasil.no_akhir;
  end loop;

  perform set_config('request.jwt.claims', '', false);
end;
$seed$;

-- ------------------------------------------------------------------
-- Penugasan penguji di tingkat PK: dua penguji, rentang dibelah dua.
-- Penguji ketiga sengaja dibiarkan tanpa tugas.
-- ------------------------------------------------------------------
do $seed$
declare
  v_p1 uuid;
  v_p2 uuid;
begin
  select id into v_p1 from auth.users where email = 'penguji1@sikat.test';
  select id into v_p2 from auth.users where email = 'penguji2@sikat.test';

  insert into public.penguji_tugas (event_id, tingkat_id, penguji_user_id, no_awal, no_akhir)
  values
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-000000000001', v_p1, 1, 110),
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-000000000001', v_p2, 111, 220);
end;
$seed$;

drop function public.seed_buat_user(text, text, text);

set session sikat.lewati_audit = 'off';
