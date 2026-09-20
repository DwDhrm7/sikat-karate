-- =====================================================================
-- SIKAT — 0007 : Bucket penyimpanan berkas & bukti bayar
--
-- Konvensi path: {peserta_id}/{nama_berkas}
-- Folder pertama adalah id peserta, itulah kunci pemeriksaan hak akses.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('berkas', 'berkas', false, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('bukti-bayar', 'bukti-bayar', false, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- Ambil id peserta dari folder pertama; null kalau bukan uuid, sehingga
-- path asal-asalan tidak menimbulkan error casting di dalam policy.
create or replace function public.peserta_id_dari_path(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when (storage.foldername(p_name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then ((storage.foldername(p_name))[1])::uuid
  end;
$$;

revoke execute on function public.peserta_id_dari_path(text) from public;
grant execute on function public.peserta_id_dari_path(text) to authenticated;

create policy sikat_berkas_baca on storage.objects
  for select to authenticated
  using (
    bucket_id in ('berkas', 'bukti-bayar')
    and public.boleh_akses_peserta(public.peserta_id_dari_path(name))
  );

create policy sikat_berkas_unggah on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('berkas', 'bukti-bayar')
    and public.boleh_akses_peserta(public.peserta_id_dari_path(name))
  );

create policy sikat_berkas_ganti on storage.objects
  for update to authenticated
  using (
    bucket_id in ('berkas', 'bukti-bayar')
    and public.boleh_akses_peserta(public.peserta_id_dari_path(name))
  )
  with check (
    bucket_id in ('berkas', 'bukti-bayar')
    and public.boleh_akses_peserta(public.peserta_id_dari_path(name))
  );

create policy sikat_berkas_hapus on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('berkas', 'bukti-bayar')
    and public.boleh_akses_peserta(public.peserta_id_dari_path(name))
  );
