import "server-only"

import { cache } from "react"

import { buatKlienServer } from "@/lib/supabase/server"

const PILIH_PENDAFTARAN = `
  id, nama_lengkap, tgl_lahir, jenis_kelamin, sabuk_sekarang,
  no_dada, no_urut, status, catatan, event_id, tingkat_id, dojo_id, user_id,
  tingkat ( id, kode, nama, sabuk_asal, sabuk_tujuan, biaya, batas_lulus,
            wajib_sertifikat_terakhir, hasil_ditutup ),
  dojo ( id, nama, kode, kota ),
  event_ujian ( id, nama, tanggal, lokasi, status ),
  pembayaran ( id, jumlah, path_bukti, status, alasan_tolak ),
  berkas_peserta ( id, jenis, path_storage, status, alasan_tolak ),
  penilaian ( nilai, hadir )
`

/**
 * Pendaftaran milik pengguna yang sedang login.
 * Tidak ada filter user_id di sini — RLS yang membatasinya.
 */
export const getPendaftaranSaya = cache(async () => {
  const supabase = await buatKlienServer()

  const { data } = await supabase
    .from("peserta")
    .select(PILIH_PENDAFTARAN)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
})

export type Pendaftaran = NonNullable<Awaited<ReturnType<typeof getPendaftaranSaya>>>

/** Event yang pendaftarannya sedang dibuka, beserta tingkat-tingkatnya. */
export const getEventTerbuka = cache(async () => {
  const supabase = await buatKlienServer()

  const { data } = await supabase
    .from("event_ujian")
    .select(
      `id, nama, tanggal, lokasi, status,
       tingkat ( id, kode, nama, sabuk_asal, sabuk_tujuan, biaya, urutan )`,
    )
    .eq("status", "pendaftaran_dibuka")
    .order("tanggal")
    .limit(1)
    .maybeSingle()

  if (!data) return null

  return {
    ...data,
    tingkat: [...data.tingkat].sort((a, b) => a.urutan - b.urutan),
  }
})

export const getDaftarDojo = cache(async () => {
  const supabase = await buatKlienServer()

  const { data } = await supabase
    .from("dojo")
    .select("id, nama, kode, kota")
    .order("nama")

  return data ?? []
})

/**
 * URL bertanda tangan untuk berkas privat. Dibuat di server dan berumur
 * pendek — path mentah tidak pernah bisa dibuka tanpa ini.
 */
export async function urlBerkas(
  bucket: string,
  path: string | null,
  detik = 600,
): Promise<string | null> {
  if (!path) return null

  const supabase = await buatKlienServer()
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, detik)

  return data?.signedUrl ?? null
}

/**
 * Satu peserta menurut id. Dipakai dojo dan kontingen; RLS yang menentukan
 * apakah barisnya terlihat, jadi tidak ada filter dojo_id di sini.
 */
export const getPesertaById = cache(async (id: string) => {
  const supabase = await buatKlienServer()

  const { data } = await supabase
    .from("peserta")
    .select(PILIH_PENDAFTARAN)
    .eq("id", id)
    .maybeSingle()

  return data
})
