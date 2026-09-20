-- =====================================================================
-- SIKAT — 0006 : Row Level Security
--
-- Pembatasan ada di database, bukan di antarmuka. Penguji yang memanggil
-- REST API langsung tetap hanya melihat peserta di rentang tugasnya.
-- =====================================================================

-- ------------------------------------------------------------------
-- Helper khusus policy
-- ------------------------------------------------------------------

-- Pemilik data administratif peserta: peserta itu sendiri, dojonya,
-- dan kontingen. PENGUJI SENGAJA TIDAK TERMASUK — berkas dan bukti
-- bayar bukan urusannya.
create or replace function public.boleh_akses_peserta(p_peserta_id uuid)
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
        p.user_id = (select auth.uid())
        or (public.peran_saya() = 'dojo' and p.dojo_id = public.dojo_saya())
        or public.adalah_kontingen()
      )
  );
$$;

-- Hasil baru boleh dilihat peserta/dojo setelah kontingen menutup tingkat.
create or replace function public.hasil_tingkat_ditutup(p_peserta_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select t.hasil_ditutup
     from public.peserta p
     join public.tingkat t on t.id = p.tingkat_id
     where p.id = p_peserta_id),
    false
  );
$$;

revoke execute on function public.boleh_akses_peserta(uuid) from public;
revoke execute on function public.hasil_tingkat_ditutup(uuid) from public;
grant execute on function public.boleh_akses_peserta(uuid) to authenticated;
grant execute on function public.hasil_tingkat_ditutup(uuid) to authenticated;

-- ------------------------------------------------------------------
alter table public.dojo            enable row level security;
alter table public.profiles        enable row level security;
alter table public.event_ujian     enable row level security;
alter table public.tingkat         enable row level security;
alter table public.peserta         enable row level security;
alter table public.berkas_peserta  enable row level security;
alter table public.pembayaran      enable row level security;
alter table public.batch_dojo      enable row level security;
alter table public.penguji_tugas   enable row level security;
alter table public.penilaian       enable row level security;
alter table public.counter_nomor   enable row level security;
alter table public.audit_log       enable row level security;

-- ------------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------------
create policy profil_lihat_sendiri on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profil_lihat_anggota_dojo on public.profiles
  for select to authenticated
  using (public.peran_saya() = 'dojo' and dojo_id = public.dojo_saya());

create policy profil_lihat_kontingen on public.profiles
  for select to authenticated
  using (public.adalah_kontingen());

create policy profil_sunting_sendiri on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profil_kelola_kontingen on public.profiles
  for all to authenticated
  using (public.adalah_kontingen())
  with check (public.adalah_kontingen());

-- ------------------------------------------------------------------
-- dojo, event_ujian, tingkat — terbaca semua pengguna login, ditulis kontingen
-- ------------------------------------------------------------------
create policy dojo_lihat_semua on public.dojo
  for select to authenticated using (true);
create policy dojo_kelola_kontingen on public.dojo
  for all to authenticated
  using (public.adalah_kontingen()) with check (public.adalah_kontingen());

create policy event_lihat_semua on public.event_ujian
  for select to authenticated using (true);
create policy event_kelola_kontingen on public.event_ujian
  for all to authenticated
  using (public.adalah_kontingen()) with check (public.adalah_kontingen());

create policy tingkat_lihat_semua on public.tingkat
  for select to authenticated using (true);
create policy tingkat_kelola_kontingen on public.tingkat
  for all to authenticated
  using (public.adalah_kontingen()) with check (public.adalah_kontingen());

-- ------------------------------------------------------------------
-- peserta
-- ------------------------------------------------------------------
create policy peserta_lihat_sendiri on public.peserta
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy peserta_lihat_dojo on public.peserta
  for select to authenticated
  using (public.peran_saya() = 'dojo' and dojo_id = public.dojo_saya());

create policy peserta_lihat_kontingen on public.peserta
  for select to authenticated
  using (public.adalah_kontingen());

-- Penguji: hanya tingkat yang ditugaskan, hanya di dalam rentang nomornya,
-- hanya yang sudah layak ujian.
create policy peserta_lihat_penguji on public.peserta
  for select to authenticated
  using (
    public.peran_saya() = 'penguji'
    and status in ('layak_ujian', 'dinilai')
    and exists (
      select 1 from public.penguji_tugas t
      where t.tingkat_id = peserta.tingkat_id
        and t.penguji_user_id = (select auth.uid())
        and (t.no_awal is null or peserta.no_urut between t.no_awal and t.no_akhir)
    )
  );

create policy peserta_daftar_sendiri on public.peserta
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'draft');

create policy peserta_daftarkan_oleh_dojo on public.peserta
  for insert to authenticated
  with check (public.peran_saya() = 'dojo' and dojo_id = public.dojo_saya());

create policy peserta_sunting_sendiri on public.peserta
  for update to authenticated
  using (user_id = (select auth.uid()) and status in ('draft', 'ditolak'))
  with check (
    user_id = (select auth.uid())
    and status in ('draft', 'menunggu_verifikasi')
  );

create policy peserta_kelola_dojo on public.peserta
  for update to authenticated
  using (public.peran_saya() = 'dojo' and dojo_id = public.dojo_saya())
  with check (public.peran_saya() = 'dojo' and dojo_id = public.dojo_saya());

create policy peserta_kelola_kontingen on public.peserta
  for all to authenticated
  using (public.adalah_kontingen()) with check (public.adalah_kontingen());

-- ------------------------------------------------------------------
-- berkas_peserta & pembayaran — penguji tidak punya akses sama sekali
-- ------------------------------------------------------------------
create policy berkas_lihat on public.berkas_peserta
  for select to authenticated
  using (public.boleh_akses_peserta(peserta_id));

create policy berkas_unggah on public.berkas_peserta
  for insert to authenticated
  with check (public.boleh_akses_peserta(peserta_id));

create policy berkas_sunting on public.berkas_peserta
  for update to authenticated
  using (public.boleh_akses_peserta(peserta_id))
  with check (public.boleh_akses_peserta(peserta_id));

create policy berkas_hapus on public.berkas_peserta
  for delete to authenticated
  using (public.boleh_akses_peserta(peserta_id));

create policy bayar_lihat on public.pembayaran
  for select to authenticated
  using (public.boleh_akses_peserta(peserta_id));

create policy bayar_unggah on public.pembayaran
  for insert to authenticated
  with check (public.boleh_akses_peserta(peserta_id));

create policy bayar_sunting on public.pembayaran
  for update to authenticated
  using (public.boleh_akses_peserta(peserta_id))
  with check (public.boleh_akses_peserta(peserta_id));

-- ------------------------------------------------------------------
-- batch_dojo — penulisan hanya lewat terbitkan_nomor_dada()
-- ------------------------------------------------------------------
create policy batch_lihat_dojo on public.batch_dojo
  for select to authenticated
  using (public.peran_saya() = 'dojo' and dojo_id = public.dojo_saya());

create policy batch_kelola_kontingen on public.batch_dojo
  for all to authenticated
  using (public.adalah_kontingen()) with check (public.adalah_kontingen());

-- ------------------------------------------------------------------
-- penguji_tugas
-- ------------------------------------------------------------------
create policy tugas_lihat_sendiri on public.penguji_tugas
  for select to authenticated
  using (penguji_user_id = (select auth.uid()));

create policy tugas_kelola_kontingen on public.penguji_tugas
  for all to authenticated
  using (public.adalah_kontingen()) with check (public.adalah_kontingen());

-- ------------------------------------------------------------------
-- penilaian
-- ------------------------------------------------------------------
create policy nilai_lihat_penguji on public.penilaian
  for select to authenticated
  using (public.peserta_dalam_tugas_saya(peserta_id));

create policy nilai_lihat_kontingen on public.penilaian
  for select to authenticated
  using (public.adalah_kontingen());

-- Peserta dan dojo baru melihat nilai setelah hasil ditutup
create policy nilai_lihat_setelah_diumumkan on public.penilaian
  for select to authenticated
  using (
    public.hasil_tingkat_ditutup(peserta_id)
    and public.boleh_akses_peserta(peserta_id)
  );

create policy nilai_isi_penguji on public.penilaian
  for insert to authenticated
  with check (
    public.peserta_dalam_tugas_saya(peserta_id)
    and not public.hasil_tingkat_ditutup(peserta_id)
  );

create policy nilai_ubah_penguji on public.penilaian
  for update to authenticated
  using (
    public.peserta_dalam_tugas_saya(peserta_id)
    and not dikunci
    and not public.hasil_tingkat_ditutup(peserta_id)
  )
  with check (public.peserta_dalam_tugas_saya(peserta_id));

create policy nilai_kelola_kontingen on public.penilaian
  for all to authenticated
  using (public.adalah_kontingen()) with check (public.adalah_kontingen());

-- ------------------------------------------------------------------
-- counter_nomor & audit_log — hanya terbaca kontingen, tidak pernah
-- ditulis langsung dari klien
-- ------------------------------------------------------------------
create policy counter_lihat_kontingen on public.counter_nomor
  for select to authenticated using (public.adalah_kontingen());

create policy audit_lihat_kontingen on public.audit_log
  for select to authenticated using (public.adalah_kontingen());

-- ------------------------------------------------------------------
-- Hak tabel. anon tidak diberi apa pun: seluruh alur menuntut login.
-- ------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;
