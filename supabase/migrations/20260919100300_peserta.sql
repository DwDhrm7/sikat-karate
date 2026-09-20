-- =====================================================================
-- SIKAT — 0003 : Peserta, berkas, pembayaran
-- =====================================================================

create table public.peserta (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.event_ujian (id) on delete cascade,
  tingkat_id        uuid not null,
  -- Nullable: peserta anak-anak boleh didaftarkan oleh dojo tanpa akun
  -- sendiri. Kalau nanti membuat akun, baris ini diklaim lewat email.
  user_id           uuid references auth.users (id) on delete set null,
  didaftarkan_oleh  uuid references auth.users (id) on delete set null,
  dojo_id           uuid not null references public.dojo (id) on delete restrict,
  nama_lengkap      text not null,
  tgl_lahir         date,
  jenis_kelamin     public.jenis_kelamin,
  sabuk_sekarang    text,
  -- Nomor dada terbit saat batch dikunci, lewat terbitkan_nomor_dada().
  -- no_urut menyimpan bagian angkanya supaya rentang penguji bisa
  -- dibandingkan sebagai bilangan, bukan sebagai teks.
  no_urut           integer check (no_urut > 0),
  no_dada           text,
  status            public.status_peserta not null default 'draft',
  catatan           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint peserta_tingkat_sesuai_event
    foreign key (tingkat_id, event_id)
    references public.tingkat (id, event_id) on update cascade,

  constraint peserta_no_dada_unik unique (event_id, tingkat_id, no_dada),
  constraint peserta_no_urut_unik unique (event_id, tingkat_id, no_urut),

  -- no_urut dan no_dada selalu terbit bersamaan
  constraint peserta_nomor_konsisten
    check ((no_urut is null) = (no_dada is null)),

  -- status di atas terverifikasi mustahil tanpa nomor dada
  constraint peserta_nomor_wajib_setelah_dikunci
    check (
      status not in ('layak_ujian', 'dinilai', 'lulus', 'tidak_lulus')
      or no_dada is not null
    )
);

-- Satu orang hanya boleh mengambil satu tingkat dalam satu event
create unique index peserta_satu_event_satu_akun
  on public.peserta (event_id, user_id)
  where user_id is not null;

create index peserta_dojo_idx on public.peserta (dojo_id, status);
create index peserta_tingkat_idx on public.peserta (tingkat_id, status);
create index peserta_user_idx on public.peserta (user_id);
create index peserta_rentang_idx on public.peserta (tingkat_id, no_urut);
create index peserta_nama_idx on public.peserta using gin (to_tsvector('simple', nama_lengkap));

create table public.berkas_peserta (
  id                uuid primary key default gen_random_uuid(),
  peserta_id        uuid not null references public.peserta (id) on delete cascade,
  jenis             public.jenis_berkas not null,
  path_storage      text not null,
  status            public.status_berkas not null default 'menunggu',
  alasan_tolak      text,
  diverifikasi_oleh uuid references auth.users (id) on delete set null,
  diverifikasi_pada timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint berkas_satu_jenis_per_peserta unique (peserta_id, jenis),
  constraint berkas_alasan_wajib_saat_ditolak
    check (status <> 'ditolak' or nullif(btrim(alasan_tolak), '') is not null)
);

create index berkas_peserta_idx on public.berkas_peserta (peserta_id, status);

create table public.pembayaran (
  id                uuid primary key default gen_random_uuid(),
  peserta_id        uuid not null unique references public.peserta (id) on delete cascade,
  jumlah            integer not null check (jumlah >= 0),
  path_bukti        text,
  status            public.status_pembayaran not null default 'menunggu',
  alasan_tolak      text,
  diverifikasi_oleh uuid references auth.users (id) on delete set null,
  diverifikasi_pada timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint pembayaran_alasan_wajib_saat_ditolak
    check (status <> 'ditolak' or nullif(btrim(alasan_tolak), '') is not null),
  constraint pembayaran_bukti_wajib_saat_lunas
    check (status <> 'lunas' or path_bukti is not null)
);
