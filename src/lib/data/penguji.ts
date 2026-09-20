import "server-only"

import { cache } from "react"

import { buatKlienServer } from "@/lib/supabase/server"

/** Tingkat yang ditugaskan ke penguji yang sedang login. */
export const getTugasSaya = cache(async () => {
  const supabase = await buatKlienServer()

  const { data } = await supabase
    .from("penguji_tugas")
    .select(
      `id, tingkat_id, no_awal, no_akhir,
       tingkat ( id, kode, nama, nilai_bawaan, batas_lulus, hasil_ditutup )`,
    )
    .order("no_awal", { nullsFirst: true })

  // Satu penguji bisa punya beberapa rentang di tingkat yang sama.
  const perTingkat = new Map<
    string,
    {
      tingkatId: string
      kode: string
      nama: string
      nilaiBawaan: number
      hasilDitutup: boolean
      rentang: { awal: number | null; akhir: number | null }[]
    }
  >()

  for (const t of data ?? []) {
    if (!t.tingkat) continue

    const ada = perTingkat.get(t.tingkat_id)
    const rentang = { awal: t.no_awal, akhir: t.no_akhir }

    if (ada) ada.rentang.push(rentang)
    else
      perTingkat.set(t.tingkat_id, {
        tingkatId: t.tingkat_id,
        kode: t.tingkat.kode,
        nama: t.tingkat.nama,
        nilaiBawaan: t.tingkat.nilai_bawaan,
        hasilDitutup: t.tingkat.hasil_ditutup,
        rentang: [rentang],
      })
  }

  return [...perTingkat.values()]
})

/**
 * Seluruh peserta di rentang penguji untuk satu tingkat, dimuat sekali
 * tanpa paginasi server. Di lapangan bersinyal buruk, satu permintaan
 * besar di awal jauh lebih baik daripada dua puluh permintaan kecil
 * sepanjang hari.
 *
 * Penyaringan rentang tidak ditulis di sini — RLS yang mengerjakannya.
 */
export async function getPesertaUntukDinilai(tingkatId: string) {
  const supabase = await buatKlienServer()

  const { data, error } = await supabase
    .from("peserta")
    .select(
      `id, no_dada, no_urut, nama_lengkap, status,
       dojo ( id, nama, kode ),
       penilaian ( nilai, hadir, dikunci )`,
    )
    .eq("tingkat_id", tingkatId)
    .order("no_urut")

  if (error) throw new Error(`Gagal memuat peserta: ${error.message}`)

  return data ?? []
}

export type PesertaDinilai = Awaited<ReturnType<typeof getPesertaUntukDinilai>>[number]
