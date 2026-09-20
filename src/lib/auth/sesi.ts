import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"

import type { Database } from "@/lib/supabase/database.types"
import { buatKlienServer } from "@/lib/supabase/server"

export type Peran = Database["public"]["Enums"]["peran"]

export type PenggunaSaatIni = {
  id: string
  email: string | null
  nama: string
  peran: Peran
  dojoId: string | null
}

export const LABEL_PERAN: Record<Peran, string> = {
  peserta: "Peserta",
  dojo: "Dojo",
  penguji: "Penguji",
  kontingen: "Kontingen",
}

export const BERANDA_PERAN: Record<Peran, string> = {
  peserta: "/peserta",
  dojo: "/dojo",
  penguji: "/penguji",
  kontingen: "/kontingen",
}

/**
 * Sumber kebenaran identitas di sisi server.
 *
 * Dibungkus cache() supaya satu render pass yang memanggilnya dari layout,
 * bilah atas, dan halaman sekaligus tetap menghasilkan satu kali kueri.
 *
 * Selalu memakai getUser(), bukan getSession(): getSession() hanya membaca
 * cookie tanpa memverifikasi tanda tangannya ke server auth.
 */
export const getPenggunaSaatIni = cache(async (): Promise<PenggunaSaatIni | null> => {
  const supabase = await buatKlienServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profil } = await supabase
    .from("profiles")
    .select("nama, peran, dojo_id")
    .eq("id", user.id)
    .maybeSingle()

  if (!profil) return null

  return {
    id: user.id,
    email: user.email ?? null,
    nama: profil.nama,
    peran: profil.peran,
    dojoId: profil.dojo_id,
  }
})

export async function wajibMasuk(): Promise<PenggunaSaatIni> {
  const pengguna = await getPenggunaSaatIni()
  if (!pengguna) redirect("/masuk")
  return pengguna
}

/**
 * Pagar peran untuk layout. Kontingen adalah superuser, jadi selalu lolos.
 */
export async function wajibPeran(...peranDiizinkan: Peran[]): Promise<PenggunaSaatIni> {
  const pengguna = await wajibMasuk()

  const lolos =
    pengguna.peran === "kontingen" || peranDiizinkan.includes(pengguna.peran)

  if (!lolos) redirect("/tidak-berwenang")

  return pengguna
}
