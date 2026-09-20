-- =====================================================================
-- SIKAT — 0012 : Penutupan hasil per tingkat
--
-- Setelah ditutup, lulus/tidak lulus terhitung dari batas_lulus dan
-- seluruh penilaian di tingkat itu terkunci. Kontingen masih bisa
-- mengubah nilai sesudahnya lewat policy-nya sendiri, dan setiap
-- perubahan itu tercatat trigger audit.
-- =====================================================================

create or replace function public.tutup_hasil(
  p_tingkat_id uuid,
  p_paksa      boolean default false
)
returns table (lulus integer, tidak_lulus integer, tanpa_nilai integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batas       smallint;
  v_ditutup     boolean;
  v_kode        text;
  v_tanpa_nilai integer;
  v_lulus       integer;
  v_gagal       integer;
begin
  if not public.adalah_kontingen() then
    raise exception 'Hanya kontingen yang boleh menutup hasil' using errcode = '42501';
  end if;

  select t.batas_lulus, t.hasil_ditutup, t.kode
    into v_batas, v_ditutup, v_kode
  from public.tingkat t
  where t.id = p_tingkat_id;

  if v_batas is null then
    raise exception 'Tingkat tidak ditemukan';
  end if;
  if v_ditutup then
    raise exception 'Hasil tingkat % sudah ditutup', v_kode;
  end if;

  -- Peserta yang belum dinilai sama sekali. Menutup hasil sementara
  -- mereka menggantung berarti memvonis tidak lulus orang yang mungkin
  -- hanya belum sempat diinput pengujinya, jadi butuh persetujuan tegas.
  select count(*)
    into v_tanpa_nilai
  from public.peserta p
  left join public.penilaian pn on pn.peserta_id = p.id
  where p.tingkat_id = p_tingkat_id
    and p.status in ('layak_ujian', 'dinilai')
    and pn.id is null;

  if v_tanpa_nilai > 0 and not p_paksa then
    raise exception
      '% peserta belum punya nilai sama sekali. Selesaikan penilaiannya, atau tutup dengan paksa untuk menandai mereka tidak lulus.',
      v_tanpa_nilai;
  end if;

  update public.peserta p
     set status = case
       when x.hadir is distinct from true then 'tidak_lulus'::public.status_peserta
       when x.nilai >= v_batas            then 'lulus'::public.status_peserta
       else 'tidak_lulus'::public.status_peserta
     end
    from (
      select p2.id, pn2.hadir, pn2.nilai
      from public.peserta p2
      left join public.penilaian pn2 on pn2.peserta_id = p2.id
      where p2.tingkat_id = p_tingkat_id
        and p2.status in ('layak_ujian', 'dinilai')
    ) x
   where p.id = x.id;

  update public.penilaian pn
     set dikunci = true
   where pn.peserta_id in (
     select p.id from public.peserta p where p.tingkat_id = p_tingkat_id
   );

  update public.tingkat t
     set hasil_ditutup = true,
         ditutup_pada  = now(),
         ditutup_oleh  = (select auth.uid())
   where t.id = p_tingkat_id;

  select
    count(*) filter (where p.status = 'lulus'),
    count(*) filter (where p.status = 'tidak_lulus')
    into v_lulus, v_gagal
  from public.peserta p
  where p.tingkat_id = p_tingkat_id;

  insert into public.audit_log (aktor_id, aksi, nama_tabel, record_id, data_baru)
  values (
    (select auth.uid()), 'tutup_hasil', 'tingkat', p_tingkat_id,
    jsonb_build_object(
      'kode', v_kode, 'batas_lulus', v_batas,
      'lulus', v_lulus, 'tidak_lulus', v_gagal,
      'tanpa_nilai', v_tanpa_nilai, 'dipaksa', p_paksa
    )
  );

  return query select v_lulus, v_gagal, v_tanpa_nilai;
end;
$$;

revoke execute on function public.tutup_hasil(uuid, boolean) from anon, public;
grant execute on function public.tutup_hasil(uuid, boolean) to authenticated;
