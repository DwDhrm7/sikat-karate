import "server-only"

import QRCode from "qrcode"

import { buatKlienServer } from "@/lib/supabase/server"

const PILIH = `
  id, no_dada, no_urut, nama_lengkap, status, tgl_lahir, jenis_kelamin,
  dojo ( id, nama, kode, kota, nama_ketua ),
  tingkat ( id, kode, nama, sabuk_asal, sabuk_tujuan, batas_lulus, hasil_ditutup ),
  event_ujian ( id, nama, tanggal, lokasi ),
  penilaian ( nilai, hadir )
`

/**
 * Tanpa filter dojo_id kalau tidak diminta — RLS yang memastikan dojo
 * hanya bisa mencetak pesertanya sendiri, sementara kontingen bebas.
 */
export async function getPesertaCetak(
  tingkatId: string,
  dojoId?: string,
  hanyaLulus = false,
) {
  const supabase = await buatKlienServer()

  let kueri = supabase
    .from("peserta")
    .select(PILIH)
    .eq("tingkat_id", tingkatId)
    .not("no_dada", "is", null)
    .order("no_urut")

  if (dojoId) kueri = kueri.eq("dojo_id", dojoId)
  if (hanyaLulus) kueri = kueri.eq("status", "lulus")

  const { data, error } = await kueri

  if (error) throw new Error(`Gagal memuat peserta: ${error.message}`)

  return data ?? []
}

export type PesertaCetak = Awaited<ReturnType<typeof getPesertaCetak>>[number]

/** QR memuat id peserta saja — cukup untuk dicocokkan panitia di lapangan. */
export async function buatQr(isi: string): Promise<string> {
  return QRCode.toDataURL(isi, {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 240,
    color: { dark: "#141414", light: "#FFFFFF" },
  })
}
