-- =====================================================================
-- SIKAT — 0002 : Tabel master (dojo, profiles, event, tingkat)
-- =====================================================================

create table public.dojo (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,
  kode        text not null unique,
  kota        text,
  nama_ketua  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.dojo is 'Dojo/ranting yang menaungi peserta.';

-- Profil melekat 1:1 dengan auth.users. Peran TIDAK PERNAH diisi dari
-- metadata pendaftaran; lihat handle_new_user() dan cegah_eskalasi_peran().
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  peran       public.peran not null default 'peserta',
  nama        text not null,
  no_hp       text,
  dojo_id     uuid references public.dojo (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_dojo_wajib_untuk_peran_dojo
    check (peran <> 'dojo' or dojo_id is not null)
);

create index profiles_dojo_id_idx on public.profiles (dojo_id);
create index profiles_peran_idx on public.profiles (peran);

create table public.event_ujian (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,
  tanggal     date not null,
  lokasi      text,
  status      public.status_event not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index event_ujian_status_idx on public.event_ujian (status);

create table public.tingkat (
  id                        uuid primary key default gen_random_uuid(),
  event_id                  uuid not null references public.event_ujian (id) on delete cascade,
  kode                      text not null,
  nama                      text not null,
  sabuk_asal                text not null,
  sabuk_tujuan              text not null,
  biaya                     integer not null default 0 check (biaya >= 0),
  nilai_bawaan              smallint not null default 80 check (nilai_bawaan between 0 and 100),
  batas_lulus               smallint not null default 60 check (batas_lulus between 0 and 100),
  urutan                    smallint not null default 1,
  wajib_sertifikat_terakhir boolean not null default true,
  hasil_ditutup             boolean not null default false,
  ditutup_pada              timestamptz,
  ditutup_oleh              uuid references auth.users (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint tingkat_kode_unik_per_event unique (event_id, kode),
  -- dipakai peserta sebagai FK gabungan agar tingkat tidak bisa berasal
  -- dari event yang berbeda
  constraint tingkat_id_event_unik unique (id, event_id),
  constraint tingkat_kode_format check (kode ~ '^[A-Z]{2,4}$')
);

create index tingkat_event_id_idx on public.tingkat (event_id, urutan);

comment on column public.tingkat.nilai_bawaan is
  'Nilai yang sudah terisi di tabel penilaian penguji. Penguji hanya mengubah yang menyimpang.';
comment on column public.tingkat.wajib_sertifikat_terakhir is
  'Tingkat dasar (mis. Putih -> Kuning) tidak menuntut sertifikat sebelumnya.';
