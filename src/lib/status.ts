import type { Database } from "@/lib/supabase/database.types"

export type StatusPeserta = Database["public"]["Enums"]["status_peserta"]
export type StatusBerkas = Database["public"]["Enums"]["status_berkas"]
export type StatusPembayaran = Database["public"]["Enums"]["status_pembayaran"]

export const LABEL_STATUS_PESERTA: Record<StatusPeserta, string> = {
  draft: "Draf",
  menunggu_verifikasi: "Menunggu verifikasi",
  ditolak: "Perlu diperbaiki",
  terverifikasi: "Terverifikasi",
  layak_ujian: "Layak ujian",
  dinilai: "Sudah dinilai",
  lulus: "Lulus",
  tidak_lulus: "Tidak lulus",
  batal: "Batal",
}

/** Nada warna lencana. Merah hanya untuk yang benar-benar perlu tindakan. */
export type NadaStatus = "netral" | "proses" | "baik" | "bahaya"

export const NADA_STATUS_PESERTA: Record<StatusPeserta, NadaStatus> = {
  draft: "netral",
  menunggu_verifikasi: "proses",
  ditolak: "bahaya",
  terverifikasi: "baik",
  layak_ujian: "baik",
  dinilai: "baik",
  lulus: "baik",
  tidak_lulus: "bahaya",
  batal: "netral",
}

export const LABEL_STATUS_BERKAS: Record<StatusBerkas, string> = {
  menunggu: "Menunggu diperiksa",
  diterima: "Diterima",
  ditolak: "Ditolak",
}

export const NADA_STATUS_BERKAS: Record<StatusBerkas, NadaStatus> = {
  menunggu: "proses",
  diterima: "baik",
  ditolak: "bahaya",
}

export const LABEL_STATUS_PEMBAYARAN: Record<StatusPembayaran, string> = {
  menunggu: "Menunggu diperiksa",
  lunas: "Lunas",
  ditolak: "Ditolak",
}

export const NADA_STATUS_PEMBAYARAN: Record<StatusPembayaran, NadaStatus> = {
  menunggu: "proses",
  lunas: "baik",
  ditolak: "bahaya",
}

export const LANGKAH_ALUR = [
  { judul: "Biodata", keterangan: "Isi data diri dan pilih tingkat" },
  { judul: "Berkas & bayar", keterangan: "Unggah persyaratan dan bukti transfer" },
  { judul: "Verifikasi dojo", keterangan: "Dojo memeriksa kelengkapanmu" },
  { judul: "Nomor dada", keterangan: "Terbit saat dojo mengunci batch" },
  { judul: "Penilaian", keterangan: "Penguji mencatat nilai di hari ujian" },
  { judul: "Hasil", keterangan: "Diumumkan setelah kontingen menutup tingkat" },
] as const

/** Indeks langkah yang sedang berjalan. Yang sebelumnya dianggap selesai. */
export function langkahBerjalan(status: StatusPeserta): number {
  switch (status) {
    case "draft":
    case "ditolak":
      return 1
    case "menunggu_verifikasi":
      return 2
    case "terverifikasi":
      return 3
    case "layak_ujian":
      return 4
    case "dinilai":
      return 5
    case "lulus":
    case "tidak_lulus":
      return LANGKAH_ALUR.length
    case "batal":
      return -1
  }
}
