import "server-only"

import { cache } from "react"

import { buatKlienServer } from "@/lib/supabase/server"

export const getDaftarEvent = cache(async () => {
  const supabase = await buatKlienServer()

  const { data } = await supabase
    .from("event_ujian")
    .select(
      `id, nama, tanggal, lokasi, status,
       tingkat ( id, kode, nama, sabuk_asal, sabuk_tujuan, biaya,
                 nilai_bawaan, batas_lulus, urutan,
                 wajib_sertifikat_terakhir, hasil_ditutup )`,
    )
    .order("tanggal", { ascending: false })

  return (data ?? []).map((e) => ({
    ...e,
    tingkat: [...e.tingkat].sort((a, b) => a.urutan - b.urutan),
  }))
})

export const getDaftarDojoKontingen = cache(async () => {
  const supabase = await buatKlienServer()

  const [{ data: dojo }, { data: peserta }, { data: akun }] = await Promise.all([
    supabase.from("dojo").select("id, nama, kode, kota, nama_ketua").order("nama"),
    supabase.from("peserta").select("dojo_id"),
    supabase.from("profiles").select("dojo_id").eq("peran", "dojo"),
  ])

  return (dojo ?? []).map((d) => ({
    ...d,
    jumlahPeserta: (peserta ?? []).filter((p) => p.dojo_id === d.id).length,
    jumlahAkun: (akun ?? []).filter((a) => a.dojo_id === d.id).length,
  }))
})

export const getDaftarAkun = cache(async () => {
  const supabase = await buatKlienServer()

  const { data } = await supabase
    .from("profiles")
    .select("id, nama, peran, no_hp, dojo_id, created_at, dojo ( nama, kode )")
    .in("peran", ["dojo", "penguji", "kontingen"])
    .order("peran")
    .order("nama")

  return data ?? []
})

/**
 * Progres tiap tingkat: berapa peserta di setiap tahap, dojo mana yang
 * batchnya belum dikunci, dan celah rentang penguji.
 */
export const getProgresTingkat = cache(async () => {
  const supabase = await buatKlienServer()

  const [{ data: tingkat }, { data: peserta }, { data: batch }, { data: dojo }, { data: tugas }] =
    await Promise.all([
      supabase
        .from("tingkat")
        .select("id, event_id, kode, nama, urutan, batas_lulus, hasil_ditutup")
        .order("urutan"),
      supabase.from("peserta").select("id, tingkat_id, dojo_id, status, no_urut"),
      supabase.from("batch_dojo").select("tingkat_id, dojo_id, status, jumlah_peserta"),
      supabase.from("dojo").select("id, nama, kode").order("nama"),
      supabase
        .from("penguji_tugas")
        .select("id, tingkat_id, penguji_user_id, no_awal, no_akhir"),
    ])

  const hasil = []

  for (const t of tingkat ?? []) {
    const milik = (peserta ?? []).filter((p) => p.tingkat_id === t.id)
    if (milik.length === 0) continue

    const perStatus = new Map<string, number>()
    for (const p of milik) perStatus.set(p.status, (perStatus.get(p.status) ?? 0) + 1)

    const layak = (perStatus.get("layak_ujian") ?? 0) + (perStatus.get("dinilai") ?? 0)
    const dinilai = perStatus.get("dinilai") ?? 0

    // Dojo yang punya peserta di tingkat ini tapi batchnya belum dikunci
    const dojoDiTingkat = new Set(milik.map((p) => p.dojo_id))
    const dojoBelumKunci = (dojo ?? []).filter(
      (d) =>
        dojoDiTingkat.has(d.id) &&
        !(batch ?? []).some(
          (b) => b.tingkat_id === t.id && b.dojo_id === d.id && b.status === "dikunci",
        ),
    )

    const { data: cakupan } = await supabase.rpc("cek_cakupan_penguji", {
      p_tingkat_id: t.id,
    })

    hasil.push({
      tingkatId: t.id,
      eventId: t.event_id,
      kode: t.kode,
      nama: t.nama,
      batasLulus: t.batas_lulus,
      hasilDitutup: t.hasil_ditutup,
      total: milik.length,
      perStatus,
      layak,
      dinilai,
      dojoBelumKunci,
      jumlahPenguji: (tugas ?? []).filter((x) => x.tingkat_id === t.id).length,
      cakupan: cakupan ?? [],
    })
  }

  return hasil
})

export const getPenugasan = cache(async () => {
  const supabase = await buatKlienServer()

  const [{ data: tugas }, { data: profil }] = await Promise.all([
    supabase
      .from("penguji_tugas")
      .select("id, event_id, tingkat_id, penguji_user_id, no_awal, no_akhir, tingkat ( kode, nama )")
      .order("no_awal", { nullsFirst: true }),
    supabase.from("profiles").select("id, nama").eq("peran", "penguji"),
  ])

  const nama = new Map((profil ?? []).map((p) => [p.id, p.nama]))

  return (tugas ?? []).map((t) => ({
    ...t,
    namaPenguji: nama.get(t.penguji_user_id) ?? "(akun terhapus)",
  }))
})

export const getDaftarPenguji = cache(async () => {
  const supabase = await buatKlienServer()
  const { data } = await supabase
    .from("profiles")
    .select("id, nama")
    .eq("peran", "penguji")
    .order("nama")
  return data ?? []
})

export type FilterAudit = { aksi?: string; tabel?: string; hari?: number }

export async function getAuditLog(filter: FilterAudit = {}) {
  const supabase = await buatKlienServer()

  let kueri = supabase
    .from("audit_log")
    .select("id, aktor_id, aksi, nama_tabel, record_id, waktu, data_lama, data_baru")
    .order("waktu", { ascending: false })
    .limit(200)

  if (filter.aksi) kueri = kueri.eq("aksi", filter.aksi)
  if (filter.tabel) kueri = kueri.eq("nama_tabel", filter.tabel)
  if (filter.hari) {
    const sejak = new Date(Date.now() - filter.hari * 86_400_000).toISOString()
    kueri = kueri.gte("waktu", sejak)
  }

  const [{ data }, { data: profil }] = await Promise.all([
    kueri,
    supabase.from("profiles").select("id, nama"),
  ])

  const nama = new Map((profil ?? []).map((p) => [p.id, p.nama]))

  return (data ?? []).map((b) => ({
    ...b,
    namaAktor: b.aktor_id ? (nama.get(b.aktor_id) ?? "(tidak dikenal)") : "sistem",
  }))
}
