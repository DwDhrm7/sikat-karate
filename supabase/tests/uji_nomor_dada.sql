-- =====================================================================
-- Uji serentak penerbitan nomor dada.
--
-- Jalankan ketiga blok di bawah dari TIGA koneksi terpisah, sedekat
-- mungkin waktunya. Kalau penomoran tidak atomik, hasilnya akan berupa
-- nomor kembar (tertangkap UNIQUE) atau blok yang saling menimpa.
--
-- Ganti tingkat_id sesuai tingkat yang batchnya masih terbuka.
-- =====================================================================

-- Koneksi 1
do $$
declare v_u uuid; v_hasil record;
begin
  select id into v_u from auth.users where email = 'dojo.bky@sikat.test';
  perform set_config('request.jwt.claims', json_build_object('sub', v_u)::text, true);
  select * into v_hasil from public.terbitkan_nomor_dada(
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-000000000002',
    '33333333-3333-3333-3333-000000000001');
  raise notice 'BKY: % nomor, % s/d %', v_hasil.jumlah, v_hasil.no_awal, v_hasil.no_akhir;
end $$;

-- Koneksi 2 — sama, dengan dojo.grs dan dojo_id ...0002
-- Koneksi 3 — sama, dengan dojo.tnm dan dojo_id ...0003

-- Pemeriksaan hasil
with x as (
  select p.no_urut, d.kode as dojo
  from public.peserta p
  join public.dojo d on d.id = p.dojo_id
  where p.tingkat_id = '22222222-2222-2222-2222-000000000002'
    and p.no_urut is not null
)
select
  (select count(*) from x)                        as total_bernomor,
  (select count(distinct no_urut) from x)         as nomor_unik,      -- harus sama dengan total
  (select count(*) from generate_series(1, (select max(no_urut) from x)) g
    where g not in (select no_urut from x))       as nomor_bolong,    -- harus 0
  (select string_agg(dojo || ':' || rentang, '  |  ' order by rentang)
     from (select dojo, min(no_urut) || '-' || max(no_urut) as rentang
           from x group by dojo) y)               as blok_per_dojo;
