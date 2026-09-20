import "server-only"

import { cache } from "react"

import { buatKlienServer } from "@/lib/supabase/server"
import type { StatusPeserta } from "@/lib/status"

export type FilterPeserta = {
  status?: StatusPeserta
  tingkat?: string
  q?: string
}

/** PostgREST memakai koma dan tanda kurung sebagai pemisah filter. */
function bersihkanPencarian(teks: string): string {
  return teks.replace(/[,()*%\\]/g, "").trim().slice(0, 60)
}

/**
 * Peserta di bawah dojo yang sedang login. Tidak ada filter dojo_id —
 * RLS yang membatasinya, jadi kontingen memakai fungsi yang sama untuk
 * melihat seluruh peserta.
 */
export async function getPesertaDojo(filter: FilterPeserta = {}) {
  const supabase = await buatKlienServer()

  let kueri = supabase
    .from("peserta")
    .select(
      `id, nama_lengkap, no_dada, no_urut, status, tingkat_id, catatan,
       tingkat ( kode, nama, wajib_sertifikat_terakhir ),
       pembayaran ( status, path_bukti ),
       berkas_peserta ( jenis, status )`,
    )
    .order("nama_lengkap")

  if (filter.status) kueri = kueri.eq("status", filter.status)
  if (filter.tingkat) kueri = kueri.eq("tingkat_id", filter.tingkat)

  if (filter.q) {
    const bersih = bersihkanPencarian(filter.q)
    if (bersih) kueri = kueri.ilike("nama_lengkap", `%${bersih}%`)
  }

  const { data, error } = await kueri

  if (error) throw new Error(`Gagal memuat peserta: ${error.message}`)

  return data ?? []
}

export type BarisPeserta = Awaited<ReturnType<typeof getPesertaDojo>>[number]

/**
 * Ringkasan per tingkat: berapa peserta di tiap status, apakah batchnya
 * sudah dikunci, dan blok nomor mana yang sudah terbit.
 */
export const getRingkasanDojo = cache(async () => {
  const supabase = await buatKlienServer()

  const [{ data: peserta }, { data: batch }, { data: tingkat }] = await Promise.all([
    supabase.from("peserta").select("id, tingkat_id, status, no_urut"),
    supabase.from("batch_dojo").select("tingkat_id, status, dikunci_pada, jumlah_peserta"),
    supabase.from("tingkat").select("id, event_id, kode, nama, urutan").order("urutan"),
  ])

  const batchPerTingkat = new Map((batch ?? []).map((b) => [b.tingkat_id, b]))

  return (tingkat ?? [])
    .map((t) => {
      const milik = (peserta ?? []).filter((p) => p.tingkat_id === t.id)
      const perStatus = new Map<string, number>()
      for (const p of milik) perStatus.set(p.status, (perStatus.get(p.status) ?? 0) + 1)

      const nomor = milik
        .map((p) => p.no_urut)
        .filter((n): n is number => n !== null)
        .sort((a, b) => a - b)

      return {
        tingkatId: t.id,
        eventId: t.event_id,
        kode: t.kode,
        nama: t.nama,
        total: milik.length,
        perStatus,
        siapDikunci: perStatus.get("terverifikasi") ?? 0,
        menggantung:
          (perStatus.get("draft") ?? 0) +
          (perStatus.get("menunggu_verifikasi") ?? 0) +
          (perStatus.get("ditolak") ?? 0),
        batch: batchPerTingkat.get(t.id) ?? null,
        blokNomor: nomor.length ? { awal: nomor[0], akhir: nomor[nomor.length - 1] } : null,
      }
    })
    .filter((t) => t.total > 0)
})
