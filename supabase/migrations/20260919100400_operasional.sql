-- =====================================================================
-- SIKAT — 0004 : Batch, penugasan penguji, penilaian, counter, audit
-- =====================================================================

create table public.batch_dojo (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.event_ujian (id) on delete cascade,
  dojo_id        uuid not null references public.dojo (id) on delete restrict,
  tingkat_id     uuid not null,
  status         public.status_batch not null default 'terbuka',
  dikunci_oleh   uuid references auth.users (id) on delete set null,
  dikunci_pada   timestamptz,
  jumlah_peserta integer not null default 0 check (jumlah_peserta >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint batch_tingkat_sesuai_event
    foreign key (tingkat_id, event_id)
    references public.tingkat (id, event_id) on update cascade,
  constraint batch_unik unique (event_id, dojo_id, tingkat_id)
);

create index batch_dojo_idx on public.batch_dojo (dojo_id, status);

-- Pembagian beban penguji lewat rentang nomor dada, bukan penguncian baris.
-- no_awal/no_akhir null = seluruh tingkat.
create table public.penguji_tugas (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.event_ujian (id) on delete cascade,
  tingkat_id      uuid not null,
  penguji_user_id uuid not null references auth.users (id) on delete cascade,
  no_awal         integer check (no_awal > 0),
  no_akhir        integer check (no_akhir > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint tugas_tingkat_sesuai_event
    foreign key (tingkat_id, event_id)
    references public.tingkat (id, event_id) on update cascade,
  constraint tugas_rentang_utuh check (
    (no_awal is null and no_akhir is null)
    or (no_awal is not null and no_akhir is not null and no_awal <= no_akhir)
  )
);

create index tugas_penguji_idx on public.penguji_tugas (penguji_user_id, tingkat_id);
create index tugas_tingkat_idx on public.penguji_tugas (tingkat_id, no_awal);

comment on table public.penguji_tugas is
  'Rentang tumpang tindih sengaja tidak dilarang di level DB; dashboard kontingen yang memperingatkan (lihat cek_cakupan_penguji).';

create table public.penilaian (
  id              uuid primary key default gen_random_uuid(),
  peserta_id      uuid not null unique references public.peserta (id) on delete cascade,
  penguji_user_id uuid references auth.users (id) on delete set null,
  nilai           smallint not null check (nilai between 0 and 100),
  hadir           boolean not null default true,
  catatan         text,
  dikunci         boolean not null default false,
  dinilai_pada    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index penilaian_penguji_idx on public.penilaian (penguji_user_id);

-- Satu baris per (event, tingkat). Baris inilah yang dikunci FOR UPDATE
-- saat penerbitan nomor dada, sehingga dua dojo yang mengunci batch
-- bersamaan tetap mendapat blok nomor yang tidak bertabrakan.
create table public.counter_nomor (
  event_id   uuid not null references public.event_ujian (id) on delete cascade,
  tingkat_id uuid not null,
  terakhir   integer not null default 0 check (terakhir >= 0),
  updated_at timestamptz not null default now(),
  primary key (event_id, tingkat_id),
  constraint counter_tingkat_sesuai_event
    foreign key (tingkat_id, event_id)
    references public.tingkat (id, event_id) on update cascade
);

create table public.audit_log (
  id         bigint generated always as identity primary key,
  aktor_id   uuid references auth.users (id) on delete set null,
  aksi       text not null,
  nama_tabel text not null,
  record_id  uuid,
  data_lama  jsonb,
  data_baru  jsonb,
  waktu      timestamptz not null default now()
);

create index audit_record_idx on public.audit_log (nama_tabel, record_id);
create index audit_waktu_idx on public.audit_log (waktu desc);
create index audit_aktor_idx on public.audit_log (aktor_id, waktu desc);
