-- =====================================================================
-- SIKAT — 0005 : Fungsi bantu, penjaga transisi, audit, nomor dada
-- =====================================================================

-- ------------------------------------------------------------------
-- updated_at
-- ------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.dojo
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.event_ujian
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tingkat
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.peserta
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.berkas_peserta
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.pembayaran
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.batch_dojo
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.penguji_tugas
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.penilaian
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- Helper peran. SECURITY DEFINER supaya policy di profiles tidak
-- memanggil dirinya sendiri (rekursi RLS).
-- ------------------------------------------------------------------
create or replace function public.peran_saya()
returns public.peran
language sql
stable
security definer
set search_path = ''
as $$
  select p.peran from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function public.dojo_saya()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.dojo_id from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function public.adalah_kontingen()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.peran = 'kontingen'
  );
$$;

-- Apakah peserta ini berada di bawah tanggung jawab penguji yang sedang login?
create or replace function public.peserta_dalam_tugas_saya(p_peserta_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.peserta ps
    join public.penguji_tugas t on t.tingkat_id = ps.tingkat_id
    where ps.id = p_peserta_id
      and t.penguji_user_id = (select auth.uid())
      and ps.status in ('layak_ujian', 'dinilai')
      and (t.no_awal is null or ps.no_urut between t.no_awal and t.no_akhir)
  );
$$;

revoke execute on function public.peran_saya() from public;
revoke execute on function public.dojo_saya() from public;
revoke execute on function public.adalah_kontingen() from public;
revoke execute on function public.peserta_dalam_tugas_saya(uuid) from public;
grant execute on function public.peran_saya() to authenticated;
grant execute on function public.dojo_saya() to authenticated;
grant execute on function public.adalah_kontingen() to authenticated;
grant execute on function public.peserta_dalam_tugas_saya(uuid) to authenticated;

-- ------------------------------------------------------------------
-- Profil otomatis saat akun dibuat. Peran SELALU 'peserta' di sini —
-- peran lain hanya boleh diberikan kontingen setelahnya.
-- ------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nama, no_hp, peran)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nama'), ''), split_part(new.email, '@', 1)),
    nullif(btrim(new.raw_user_meta_data ->> 'no_hp'), ''),
    'peserta'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Peserta boleh menyunting namanya sendiri, tidak boleh menaikkan perannya.
create or replace function public.cegah_eskalasi_peran()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;                      -- operasi sistem / service_role
  end if;
  if public.adalah_kontingen() then
    return new;
  end if;
  if new.peran is distinct from old.peran or new.dojo_id is distinct from old.dojo_id then
    raise exception 'Peran dan dojo hanya dapat diubah oleh kontingen'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger cegah_eskalasi_peran before update on public.profiles
  for each row execute function public.cegah_eskalasi_peran();

-- ------------------------------------------------------------------
-- Penjaga transisi status peserta.
-- Fungsi sistem menandai dirinya lewat GUC sikat.operasi_sistem.
-- ------------------------------------------------------------------
create or replace function public.jaga_transisi_status()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_peran public.peran;
  v_sah   boolean;
begin
  if new.status = old.status then
    return new;
  end if;

  if coalesce(current_setting('sikat.operasi_sistem', true), 'off') = 'on' then
    return new;
  end if;

  v_peran := public.peran_saya();

  if v_peran is null then
    return new;                      -- seed / service_role
  end if;

  if v_peran = 'kontingen' then
    return new;                      -- superuser, tetap tercatat di audit_log
  end if;

  v_sah := case
    when old.status = 'draft'               and new.status = 'menunggu_verifikasi' then v_peran in ('peserta', 'dojo')
    when old.status = 'ditolak'             and new.status = 'menunggu_verifikasi' then v_peran in ('peserta', 'dojo')
    when old.status = 'menunggu_verifikasi' and new.status = 'ditolak'             then v_peran = 'dojo'
    when old.status = 'menunggu_verifikasi' and new.status = 'terverifikasi'       then v_peran = 'dojo'
    when old.status = 'terverifikasi'       and new.status = 'menunggu_verifikasi' then v_peran = 'dojo'
    when old.status = 'layak_ujian'         and new.status = 'dinilai'             then v_peran = 'penguji'
    when new.status = 'batal'                                                      then v_peran = 'dojo'
    else false
  end;

  if not v_sah then
    raise exception 'Transisi status % -> % tidak diizinkan untuk peran %',
      old.status, new.status, v_peran using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger jaga_transisi_status before update of status on public.peserta
  for each row execute function public.jaga_transisi_status();

-- ------------------------------------------------------------------
-- Audit generik
-- ------------------------------------------------------------------
create or replace function public.catat_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_record_id uuid;
begin
  if coalesce(current_setting('sikat.lewati_audit', true), 'off') = 'on' then
    return coalesce(new, old);
  end if;

  v_record_id := case when tg_op = 'DELETE' then old.id else new.id end;

  insert into public.audit_log (aktor_id, aksi, nama_tabel, record_id, data_lama, data_baru)
  values (
    (select auth.uid()),
    tg_op,
    tg_table_name,
    v_record_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('UPDATE', 'INSERT') then to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$;

create trigger catat_audit after update or delete on public.peserta
  for each row execute function public.catat_audit();
create trigger catat_audit after update or delete on public.berkas_peserta
  for each row execute function public.catat_audit();
create trigger catat_audit after update or delete on public.pembayaran
  for each row execute function public.catat_audit();
create trigger catat_audit after update or delete on public.tingkat
  for each row execute function public.catat_audit();
create trigger catat_audit after update or delete on public.profiles
  for each row execute function public.catat_audit();
create trigger catat_audit after insert or update or delete on public.penilaian
  for each row execute function public.catat_audit();
create trigger catat_audit after insert or update or delete on public.batch_dojo
  for each row execute function public.catat_audit();
create trigger catat_audit after insert or update or delete on public.penguji_tugas
  for each row execute function public.catat_audit();

-- ------------------------------------------------------------------
-- PENERBITAN NOMOR DADA
--
-- Dipanggil saat dojo mengunci batch. Serialisasi terjadi pada baris
-- counter_nomor (SELECT ... FOR UPDATE): dua dojo yang menekan
-- "Kunci Batch" pada detik yang sama akan antre, bukan bertabrakan.
-- Tiap dojo menerima satu blok nomor berurutan sehingga pesertanya
-- berdekatan di lapangan.
-- ------------------------------------------------------------------
create or replace function public.terbitkan_nomor_dada(
  p_event_id   uuid,
  p_tingkat_id uuid,
  p_dojo_id    uuid
)
returns table (jumlah integer, no_awal integer, no_akhir integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_peran         public.peran;
  v_kode          text;
  v_hasil_ditutup boolean;
  v_status_event  public.status_event;
  v_terakhir      integer;
  v_jumlah        integer;
begin
  v_peran := public.peran_saya();

  if v_peran is null then
    raise exception 'Tidak ada sesi pengguna' using errcode = '42501';
  end if;
  if v_peran not in ('kontingen', 'dojo') then
    raise exception 'Hanya dojo atau kontingen yang boleh mengunci batch' using errcode = '42501';
  end if;
  if v_peran = 'dojo' and public.dojo_saya() is distinct from p_dojo_id then
    raise exception 'Dojo hanya boleh mengunci batch dojonya sendiri' using errcode = '42501';
  end if;

  select t.kode, t.hasil_ditutup, e.status
    into v_kode, v_hasil_ditutup, v_status_event
  from public.tingkat t
  join public.event_ujian e on e.id = t.event_id
  where t.id = p_tingkat_id and t.event_id = p_event_id;

  if v_kode is null then
    raise exception 'Tingkat tidak ditemukan pada event tersebut';
  end if;
  if v_hasil_ditutup then
    raise exception 'Hasil tingkat % sudah ditutup, nomor tidak bisa diterbitkan lagi', v_kode;
  end if;
  if v_status_event = 'selesai' then
    raise exception 'Event sudah selesai';
  end if;

  -- Pastikan baris counter ada, lalu kunci. Titik serialisasi.
  insert into public.counter_nomor (event_id, tingkat_id, terakhir)
  values (p_event_id, p_tingkat_id, 0)
  on conflict (event_id, tingkat_id) do nothing;

  select c.terakhir into v_terakhir
  from public.counter_nomor c
  where c.event_id = p_event_id and c.tingkat_id = p_tingkat_id
  for update;

  select count(*) into v_jumlah
  from public.peserta p
  where p.event_id   = p_event_id
    and p.tingkat_id = p_tingkat_id
    and p.dojo_id    = p_dojo_id
    and p.status     = 'terverifikasi'
    and p.no_dada is null;

  if v_jumlah = 0 then
    raise exception 'Tidak ada peserta terverifikasi yang menunggu nomor dada di dojo ini';
  end if;

  perform set_config('sikat.operasi_sistem', 'on', true);

  with urut as (
    select p.id,
           v_terakhir + row_number() over (order by p.nama_lengkap, p.id) as nomor
    from public.peserta p
    where p.event_id   = p_event_id
      and p.tingkat_id = p_tingkat_id
      and p.dojo_id    = p_dojo_id
      and p.status     = 'terverifikasi'
      and p.no_dada is null
  )
  update public.peserta p
     set no_urut = u.nomor,
         no_dada = v_kode || '-' || lpad(u.nomor::text, 3, '0'),
         status  = 'layak_ujian'
    from urut u
   where p.id = u.id;

  update public.counter_nomor c
     set terakhir = v_terakhir + v_jumlah,
         updated_at = now()
   where c.event_id = p_event_id and c.tingkat_id = p_tingkat_id;

  insert into public.batch_dojo as b
    (event_id, dojo_id, tingkat_id, status, dikunci_oleh, dikunci_pada, jumlah_peserta)
  values
    (p_event_id, p_dojo_id, p_tingkat_id, 'dikunci', (select auth.uid()), now(), v_jumlah)
  on conflict (event_id, dojo_id, tingkat_id) do update
     set status         = 'dikunci',
         dikunci_oleh   = (select auth.uid()),
         dikunci_pada   = now(),
         jumlah_peserta = b.jumlah_peserta + excluded.jumlah_peserta,
         updated_at     = now();

  insert into public.audit_log (aktor_id, aksi, nama_tabel, record_id, data_baru)
  values (
    (select auth.uid()), 'terbitkan_nomor_dada', 'peserta', null,
    jsonb_build_object(
      'event_id', p_event_id, 'tingkat_id', p_tingkat_id, 'dojo_id', p_dojo_id,
      'kode', v_kode, 'jumlah', v_jumlah,
      'no_awal', v_terakhir + 1, 'no_akhir', v_terakhir + v_jumlah
    )
  );

  perform set_config('sikat.operasi_sistem', 'off', true);

  return query select v_jumlah, v_terakhir + 1, v_terakhir + v_jumlah;
end;
$$;

revoke execute on function public.terbitkan_nomor_dada(uuid, uuid, uuid) from public;
grant execute on function public.terbitkan_nomor_dada(uuid, uuid, uuid) to authenticated;

-- ------------------------------------------------------------------
-- Cakupan rentang penguji: cari nomor yang belum dipegang siapa pun
-- ('kosong') dan yang dipegang lebih dari satu penguji ('tumpang_tindih').
-- ------------------------------------------------------------------
create or replace function public.cek_cakupan_penguji(p_tingkat_id uuid)
returns table (jenis text, dari integer, sampai integer)
language sql
stable
security definer
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

revoke execute on function public.cek_cakupan_penguji(uuid) from public;
grant execute on function public.cek_cakupan_penguji(uuid) to authenticated;
