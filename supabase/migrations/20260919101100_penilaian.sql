-- =====================================================================
-- SIKAT — 0011 : Penyimpanan nilai borongan
--
-- Penguji menekan "Simpan Semua" sekali untuk ratusan baris di lapangan
-- yang sinyalnya buruk. Satu permintaan berisi array, bukan satu
-- permintaan per peserta.
--
-- Mengembalikan daftar peserta_id yang benar-benar tersimpan, bukan
-- sekadar jumlah: klien memakainya untuk menandai baris mana yang sudah
-- dikonfirmasi server, dan sisanya tetap di antrean.
-- =====================================================================

create or replace function public.simpan_penilaian(p_items jsonb)
returns setof uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_peran public.peran;
  v_uid   uuid;
  v_total integer;
begin
  v_uid := (select auth.uid());
  v_peran := public.peran_saya();

  if v_peran is null or v_peran not in ('penguji', 'kontingen') then
    raise exception 'Hanya penguji atau kontingen yang boleh menyimpan nilai'
      using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Kiriman harus berupa array';
  end if;

  v_total := jsonb_array_length(p_items);

  if v_total = 0 then
    raise exception 'Tidak ada nilai untuk disimpan';
  end if;
  if v_total > 500 then
    raise exception 'Maksimal 500 nilai sekali kirim';
  end if;

  return query
  with kiriman as (
    select (e.item ->> 'peserta_id')::uuid                          as peserta_id,
           (e.item ->> 'nilai')::smallint                           as nilai,
           coalesce((e.item ->> 'hadir')::boolean, true)            as hadir,
           nullif(btrim(coalesce(e.item ->> 'catatan', '')), '')    as catatan,
           e.urut
    from jsonb_array_elements(p_items) with ordinality as e(item, urut)
  ),
  -- Kalau satu peserta terkirim dua kali (antrean yang menumpuk), yang
  -- terakhir yang menang.
  unik as (
    select distinct on (k.peserta_id) k.peserta_id, k.nilai, k.hadir, k.catatan
    from kiriman k
    order by k.peserta_id, k.urut desc
  ),
  sah as (
    select u.*
    from unik u
    join public.peserta p on p.id = u.peserta_id
    join public.tingkat t on t.id = p.tingkat_id
    where p.status in ('layak_ujian', 'dinilai')
      and t.hasil_ditutup = false
      and u.nilai between 0 and 100
      and not exists (
        select 1 from public.penilaian pn
        where pn.peserta_id = u.peserta_id and pn.dikunci
      )
      and (
        v_peran = 'kontingen'
        or exists (
          select 1
          from public.penguji_tugas tg
          where tg.tingkat_id = p.tingkat_id
            and tg.penguji_user_id = v_uid
            and (tg.no_awal is null or p.no_urut between tg.no_awal and tg.no_akhir)
        )
      )
  ),
  tulis as (
    insert into public.penilaian
      (peserta_id, penguji_user_id, nilai, hadir, catatan, dinilai_pada)
    select s.peserta_id, v_uid, s.nilai, s.hadir, s.catatan, now()
    from sah s
    on conflict (peserta_id) do update
      set penguji_user_id = excluded.penguji_user_id,
          nilai           = excluded.nilai,
          hadir           = excluded.hadir,
          catatan         = excluded.catatan,
          dinilai_pada    = now()
    returning peserta_id
  ),
  majukan as (
    update public.peserta
       set status = 'dinilai'
     where id in (select s.peserta_id from sah s)
       and status = 'layak_ujian'
    returning id
  )
  select t.peserta_id from tulis t;
end;
$$;

revoke execute on function public.simpan_penilaian(jsonb) from anon, public;
grant execute on function public.simpan_penilaian(jsonb) to authenticated;
