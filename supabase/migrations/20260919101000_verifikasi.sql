-- =====================================================================
-- SIKAT — 0010 : Verifikasi borongan dan penolakan
--
-- Dojo menyetujui ratusan peserta sekaligus. Kalau itu dikerjakan sebagai
-- ratusan permintaan dari klien, satu koneksi putus di tengah meninggalkan
-- separuh peserta terverifikasi dan separuh tidak. Kedua operasi di bawah
-- berjalan dalam satu transaksi.
-- =====================================================================

-- Jenis berkas yang wajib ada untuk sebuah tingkat.
create or replace function public.berkas_wajib(p_wajib_sertifikat boolean)
returns public.jenis_berkas[]
language sql
immutable
set search_path = ''
as $$
  select case
    when p_wajib_sertifikat then
      array['pas_foto', 'akta_atau_kk', 'surat_sehat', 'sertifikat_terakhir']::public.jenis_berkas[]
    else
      array['pas_foto', 'akta_atau_kk', 'surat_sehat']::public.jenis_berkas[]
  end;
$$;

create or replace function public.verifikasi_massal(p_peserta_ids uuid[])
returns table (diproses integer, dilewati integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_peran    public.peran;
  v_dojo     uuid;
  v_sasaran  uuid[];
  v_total    integer;
  v_diproses integer;
begin
  v_peran := public.peran_saya();

  if v_peran is null or v_peran not in ('dojo', 'kontingen') then
    raise exception 'Hanya dojo atau kontingen yang boleh memverifikasi'
      using errcode = '42501';
  end if;

  v_dojo := public.dojo_saya();
  v_total := coalesce(array_length(p_peserta_ids, 1), 0);

  if v_total = 0 then
    raise exception 'Tidak ada peserta yang dipilih';
  end if;
  if v_total > 500 then
    raise exception 'Maksimal 500 peserta sekali proses';
  end if;

  -- Yang benar-benar layak: milik dojo pemanggil, masih menunggu
  -- verifikasi, berkas wajibnya lengkap, dan bukti transfernya ada.
  -- Sisanya dilewati diam-diam, bukan menggagalkan seluruh kiriman.
  select array_agg(p.id)
    into v_sasaran
  from public.peserta p
  join public.tingkat t on t.id = p.tingkat_id
  where p.id = any (p_peserta_ids)
    and p.status = 'menunggu_verifikasi'
    and (v_peran = 'kontingen' or p.dojo_id = v_dojo)
    and exists (
      select 1 from public.pembayaran b
      where b.peserta_id = p.id and b.path_bukti is not null
    )
    and not exists (
      select 1
      from unnest(public.berkas_wajib(t.wajib_sertifikat_terakhir)) as perlu(jenis)
      where not exists (
        select 1 from public.berkas_peserta bp
        where bp.peserta_id = p.id and bp.jenis = perlu.jenis
      )
    );

  v_diproses := coalesce(array_length(v_sasaran, 1), 0);

  if v_diproses = 0 then
    return query select 0, v_total;
    return;
  end if;

  update public.berkas_peserta
     set status = 'diterima',
         alasan_tolak = null,
         diverifikasi_oleh = (select auth.uid()),
         diverifikasi_pada = now()
   where peserta_id = any (v_sasaran);

  update public.pembayaran
     set status = 'lunas',
         alasan_tolak = null,
         diverifikasi_oleh = (select auth.uid()),
         diverifikasi_pada = now()
   where peserta_id = any (v_sasaran);

  -- Trigger jaga_transisi_status sengaja dibiarkan menyala: peran pemanggil
  -- diperiksa dua kali, di sini dan di trigger.
  update public.peserta
     set status = 'terverifikasi',
         catatan = null
   where id = any (v_sasaran);

  insert into public.audit_log (aktor_id, aksi, nama_tabel, record_id, data_baru)
  values (
    (select auth.uid()), 'verifikasi_massal', 'peserta', null,
    jsonb_build_object('diminta', v_total, 'diproses', v_diproses, 'dojo_id', v_dojo)
  );

  return query select v_diproses, v_total - v_diproses;
end;
$$;

create or replace function public.tolak_peserta(
  p_peserta_id        uuid,
  p_alasan            text,
  p_jenis_ditolak     public.jenis_berkas[] default '{}',
  p_tolak_pembayaran  boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_peran  public.peran;
  v_dojo   uuid;
  v_status public.status_peserta;
  v_pemilik uuid;
begin
  v_peran := public.peran_saya();

  if v_peran is null or v_peran not in ('dojo', 'kontingen') then
    raise exception 'Hanya dojo atau kontingen yang boleh menolak'
      using errcode = '42501';
  end if;

  if nullif(btrim(p_alasan), '') is null then
    raise exception 'Alasan penolakan wajib diisi';
  end if;

  select p.status, p.dojo_id into v_status, v_pemilik
  from public.peserta p where p.id = p_peserta_id;

  if v_status is null then
    raise exception 'Peserta tidak ditemukan';
  end if;

  v_dojo := public.dojo_saya();
  if v_peran = 'dojo' and v_pemilik is distinct from v_dojo then
    raise exception 'Peserta ini bukan dari dojomu' using errcode = '42501';
  end if;

  if v_status <> 'menunggu_verifikasi' then
    raise exception 'Hanya pendaftaran yang sedang menunggu verifikasi yang bisa ditolak';
  end if;

  if array_length(p_jenis_ditolak, 1) > 0 then
    update public.berkas_peserta
       set status = 'ditolak',
           alasan_tolak = btrim(p_alasan),
           diverifikasi_oleh = (select auth.uid()),
           diverifikasi_pada = now()
     where peserta_id = p_peserta_id
       and jenis = any (p_jenis_ditolak);
  end if;

  if p_tolak_pembayaran then
    update public.pembayaran
       set status = 'ditolak',
           alasan_tolak = btrim(p_alasan),
           diverifikasi_oleh = (select auth.uid()),
           diverifikasi_pada = now()
     where peserta_id = p_peserta_id;
  end if;

  update public.peserta
     set status = 'ditolak',
         catatan = btrim(p_alasan)
   where id = p_peserta_id;
end;
$$;

revoke execute on function public.berkas_wajib(boolean) from anon, public;
revoke execute on function public.verifikasi_massal(uuid[]) from anon, public;
revoke execute on function public.tolak_peserta(uuid, text, public.jenis_berkas[], boolean)
  from anon, public;

grant execute on function public.berkas_wajib(boolean) to authenticated;
grant execute on function public.verifikasi_massal(uuid[]) to authenticated;
grant execute on function public.tolak_peserta(uuid, text, public.jenis_berkas[], boolean)
  to authenticated;
