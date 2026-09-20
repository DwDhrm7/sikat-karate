-- =====================================================================
-- SIKAT — 0008 : Pengerasan hak eksekusi fungsi
--
-- Supabase memberi EXECUTE ke anon dan authenticated lewat default
-- privileges, jadi "revoke from public" saja tidak cukup: setiap fungsi
-- di schema public terbuka sebagai endpoint /rest/v1/rpc/.
-- =====================================================================

-- search_path terkunci supaya fungsi tidak bisa dibajak lewat schema
-- buatan pemanggil
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Cakupan penguji tidak perlu SECURITY DEFINER: kontingen memang sudah
-- melihat seluruh peserta dan penugasan lewat policy-nya sendiri.
create or replace function public.cek_cakupan_penguji(p_tingkat_id uuid)
returns table (jenis text, dari integer, sampai integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with batas as (
    select coalesce(max(p.no_urut), 0) as maks
    from public.peserta p
    where p.tingkat_id = p_tingkat_id and p.status <> 'batal'
  ),
  tugas as (
    select coalesce(t.no_awal, 1) as a,
           coalesce(t.no_akhir, (select maks from batas)) as z
    from public.penguji_tugas t
    where t.tingkat_id = p_tingkat_id
  ),
  hitung as (
    select n.n,
           (select count(*) from tugas t where n.n between t.a and t.z) as jml
    from generate_series(1, (select maks from batas)) as n(n)
  ),
  kelompok as (
    select h.n,
           (h.jml = 0) as kosong,
           h.n - row_number() over (partition by (h.jml = 0) order by h.n) as grp
    from hitung h
    where h.jml <> 1
  )
  select case when k.kosong then 'kosong' else 'tumpang_tindih' end,
         min(k.n)::integer,
         max(k.n)::integer
  from kelompok k
  group by k.kosong, k.grp
  order by 2;
$$;

-- anon tidak berkepentingan pada satu pun fungsi di sini
revoke execute on function public.peran_saya()                        from anon, public;
revoke execute on function public.dojo_saya()                         from anon, public;
revoke execute on function public.adalah_kontingen()                  from anon, public;
revoke execute on function public.peserta_dalam_tugas_saya(uuid)      from anon, public;
revoke execute on function public.boleh_akses_peserta(uuid)           from anon, public;
revoke execute on function public.hasil_tingkat_ditutup(uuid)         from anon, public;
revoke execute on function public.peserta_id_dari_path(text)          from anon, public;
revoke execute on function public.cek_cakupan_penguji(uuid)           from anon, public;
revoke execute on function public.terbitkan_nomor_dada(uuid,uuid,uuid) from anon, public;

-- Fungsi trigger bukan API. Hak eksekusinya diperiksa saat CREATE
-- TRIGGER, bukan saat trigger menyala, jadi mencabutnya di sini tidak
-- mematahkan apa pun.
revoke execute on function public.set_updated_at()        from anon, authenticated, public;
revoke execute on function public.handle_new_user()       from anon, authenticated, public;
revoke execute on function public.catat_audit()           from anon, authenticated, public;
revoke execute on function public.cegah_eskalasi_peran()  from anon, authenticated, public;
revoke execute on function public.jaga_transisi_status()  from anon, authenticated, public;

grant execute on function public.peran_saya()                         to authenticated;
grant execute on function public.dojo_saya()                          to authenticated;
grant execute on function public.adalah_kontingen()                   to authenticated;
grant execute on function public.peserta_dalam_tugas_saya(uuid)       to authenticated;
grant execute on function public.boleh_akses_peserta(uuid)            to authenticated;
grant execute on function public.hasil_tingkat_ditutup(uuid)          to authenticated;
grant execute on function public.peserta_id_dari_path(text)           to authenticated;
grant execute on function public.cek_cakupan_penguji(uuid)            to authenticated;
grant execute on function public.terbitkan_nomor_dada(uuid,uuid,uuid) to authenticated;
