-- =====================================================================
-- SIKAT — Sistem Ujian Kenaikan Tingkat Karate
-- 0001 : Tipe enum dasar
-- =====================================================================

create type public.peran as enum ('peserta', 'dojo', 'penguji', 'kontingen');

create type public.status_event as enum (
  'draft',
  'pendaftaran_dibuka',
  'pendaftaran_ditutup',
  'berlangsung',
  'selesai'
);

-- Alur hidup peserta. Transisi dijaga trigger jaga_transisi_status(),
-- bukan hanya oleh kode aplikasi.
create type public.status_peserta as enum (
  'draft',
  'menunggu_verifikasi',
  'ditolak',
  'terverifikasi',
  'layak_ujian',
  'dinilai',
  'lulus',
  'tidak_lulus',
  'batal'
);

create type public.jenis_berkas as enum (
  'pas_foto',
  'akta_atau_kk',
  'surat_sehat',
  'sertifikat_terakhir'
);

create type public.status_berkas as enum ('menunggu', 'diterima', 'ditolak');

create type public.status_pembayaran as enum ('menunggu', 'lunas', 'ditolak');

create type public.status_batch as enum ('terbuka', 'dikunci');

create type public.jenis_kelamin as enum ('L', 'P');
