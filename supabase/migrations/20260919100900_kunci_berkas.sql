-- =====================================================================
-- SIKAT — 0009 : Berkas dan pembayaran terkunci setelah diverifikasi
--
-- Sebelumnya peserta boleh mengganti berkasnya kapan saja, termasuk
-- sesudah dojo menerimanya — verifikasi jadi batal tanpa ada yang tahu.
-- Sekarang peserta hanya boleh menyentuh berkas selama masih draft,
-- ditolak, atau menunggu verifikasi. Dojo dan kontingen tetap bebas.
-- =====================================================================

create or replace function public.boleh_ubah_berkas(p_peserta_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.peserta p
    where p.id = p_peserta_id
      and (
        (
          p.user_id = (select auth.uid())
          and p.status in ('draft', 'ditolak', 'menunggu_verifikasi')
        )
        or (public.peran_saya() = 'dojo' and p.dojo_id = public.dojo_saya())
        or public.adalah_kontingen()
      )
  );
$$;

revoke execute on function public.boleh_ubah_berkas(uuid) from anon, public;
grant execute on function public.boleh_ubah_berkas(uuid) to authenticated;

drop policy berkas_unggah on public.berkas_peserta;
drop policy berkas_sunting on public.berkas_peserta;
drop policy berkas_hapus on public.berkas_peserta;

create policy berkas_unggah on public.berkas_peserta
  for insert to authenticated
  with check (public.boleh_ubah_berkas(peserta_id));

create policy berkas_sunting on public.berkas_peserta
  for update to authenticated
  using (public.boleh_ubah_berkas(peserta_id))
  with check (public.boleh_ubah_berkas(peserta_id));

create policy berkas_hapus on public.berkas_peserta
  for delete to authenticated
  using (public.boleh_ubah_berkas(peserta_id));

drop policy bayar_unggah on public.pembayaran;
drop policy bayar_sunting on public.pembayaran;

create policy bayar_unggah on public.pembayaran
  for insert to authenticated
  with check (public.boleh_ubah_berkas(peserta_id));

create policy bayar_sunting on public.pembayaran
  for update to authenticated
  using (public.boleh_ubah_berkas(peserta_id))
  with check (public.boleh_ubah_berkas(peserta_id));

-- Penyimpanan berkas mengikuti aturan yang sama: membaca boleh selama
-- masih berhak, menulis hanya selama berkas belum terkunci.
drop policy sikat_berkas_unggah on storage.objects;
drop policy sikat_berkas_ganti on storage.objects;
drop policy sikat_berkas_hapus on storage.objects;

create policy sikat_berkas_unggah on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('berkas', 'bukti-bayar')
    and public.boleh_ubah_berkas(public.peserta_id_dari_path(name))
  );

create policy sikat_berkas_ganti on storage.objects
  for update to authenticated
  using (
    bucket_id in ('berkas', 'bukti-bayar')
    and public.boleh_ubah_berkas(public.peserta_id_dari_path(name))
  )
  with check (
    bucket_id in ('berkas', 'bukti-bayar')
    and public.boleh_ubah_berkas(public.peserta_id_dari_path(name))
  );

create policy sikat_berkas_hapus on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('berkas', 'bukti-bayar')
    and public.boleh_ubah_berkas(public.peserta_id_dari_path(name))
  );
