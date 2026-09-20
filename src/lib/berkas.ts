import type { Database } from "@/lib/supabase/database.types"

export type JenisBerkas = Database["public"]["Enums"]["jenis_berkas"]
export type StatusBerkas = Database["public"]["Enums"]["status_berkas"]

export const BUCKET_BERKAS = "berkas"
export const BUCKET_BUKTI = "bukti-bayar"

export const UKURAN_MAKS = 5 * 1024 * 1024
export const TIPE_DIIZINKAN = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const

export const LABEL_BERKAS: Record<JenisBerkas, string> = {
  pas_foto: "Pas foto",
  akta_atau_kk: "Akta kelahiran atau Kartu Keluarga",
  surat_sehat: "Surat keterangan sehat",
  sertifikat_terakhir: "Sertifikat tingkat terakhir",
}

export const PETUNJUK_BERKAS: Record<JenisBerkas, string> = {
  pas_foto: "Latar polos, wajah menghadap depan dan terlihat jelas.",
  akta_atau_kk: "Boleh salah satu. Pastikan nama dan tanggal lahir terbaca.",
  surat_sehat: "Dari puskesmas atau klinik, diterbitkan tahun ini.",
  sertifikat_terakhir: "Sertifikat kenaikan tingkat yang terakhir diterima.",
}

const BERKAS_DASAR: JenisBerkas[] = ["pas_foto", "akta_atau_kk", "surat_sehat"]

/** Tingkat dasar tidak menuntut sertifikat sebelumnya. */
export function berkasDiperlukan(wajibSertifikatTerakhir: boolean): JenisBerkas[] {
  return wajibSertifikatTerakhir
    ? [...BERKAS_DASAR, "sertifikat_terakhir"]
    : BERKAS_DASAR
}

export function periksaBerkas(file: File): string | null {
  if (!TIPE_DIIZINKAN.includes(file.type as (typeof TIPE_DIIZINKAN)[number])) {
    return "Format harus JPG, PNG, WEBP, atau PDF."
  }
  if (file.size > UKURAN_MAKS) {
    return `Ukuran maksimal 5 MB. Berkas ini ${(file.size / 1024 / 1024).toFixed(1)} MB.`
  }
  return null
}

export function ekstensiDari(file: File): string {
  const dariNama = file.name.split(".").pop()?.toLowerCase()
  if (dariNama && /^[a-z0-9]{2,5}$/.test(dariNama)) return dariNama
  return file.type === "application/pdf" ? "pdf" : "jpg"
}

export function rupiah(nilai: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai)
}
