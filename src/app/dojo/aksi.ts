"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { wajibPeran } from "@/lib/auth/sesi"
import type { JenisBerkas } from "@/lib/berkas"
import { SkemaPendaftaran } from "@/lib/skema/peserta"
import { buatKlienServer } from "@/lib/supabase/server"

export type StatusAksi = {
  galat?: string
  sukses?: string
  galatField?: Record<string, string[] | undefined>
}

// Dojo tidak memilih dojo — dojonya diambil dari profilnya sendiri.
const SkemaDaftarkan = SkemaPendaftaran.omit({ dojo_id: true })

export async function aksiDaftarkanPeserta(
  _sebelumnya: StatusAksi,
  formData: FormData,
): Promise<StatusAksi> {
  const pengguna = await wajibPeran("dojo")

  if (!pengguna.dojoId) {
    return { galat: "Akun ini belum terhubung ke dojo mana pun." }
  }

  const hasil = SkemaDaftarkan.safeParse(Object.fromEntries(formData))

  if (!hasil.success) {
    return { galatField: z.flattenError(hasil.error).fieldErrors }
  }

  const supabase = await buatKlienServer()

  const { data: tingkat } = await supabase
    .from("tingkat")
    .select("id, event_id, biaya, sabuk_asal, event_ujian ( status )")
    .eq("id", hasil.data.tingkat_id)
    .maybeSingle()

  if (!tingkat) return { galat: "Tingkat tidak ditemukan." }
  if (tingkat.event_ujian?.status !== "pendaftaran_dibuka") {
    return { galat: "Pendaftaran untuk event ini sudah ditutup." }
  }

  const { data: peserta, error } = await supabase
    .from("peserta")
    .insert({
      event_id: tingkat.event_id,
      tingkat_id: tingkat.id,
      user_id: null,
      didaftarkan_oleh: pengguna.id,
      dojo_id: pengguna.dojoId,
      nama_lengkap: hasil.data.nama_lengkap,
      tgl_lahir: hasil.data.tgl_lahir,
      jenis_kelamin: hasil.data.jenis_kelamin,
      sabuk_sekarang: tingkat.sabuk_asal,
      status: "draft",
    })
    .select("id")
    .single()

  if (error) return { galat: `Gagal menyimpan peserta: ${error.message}` }

  const { error: galatBayar } = await supabase.from("pembayaran").insert({
    peserta_id: peserta.id,
    jumlah: tingkat.biaya,
  })

  if (galatBayar) {
    return { galat: `Peserta tersimpan, tetapi tagihan gagal dibuat: ${galatBayar.message}` }
  }

  revalidatePath("/dojo", "layout")
  redirect(`/dojo/peserta/${peserta.id}`)
}

export async function aksiVerifikasiMassal(
  pesertaIds: string[],
): Promise<StatusAksi & { diproses?: number; dilewati?: number }> {
  await wajibPeran("dojo")

  if (pesertaIds.length === 0) {
    return { galat: "Belum ada peserta yang dicentang." }
  }

  const supabase = await buatKlienServer()

  // Satu panggilan untuk seluruh centangan, bukan satu per peserta.
  const { data, error } = await supabase.rpc("verifikasi_massal", {
    p_peserta_ids: pesertaIds,
  })

  if (error) return { galat: error.message }

  const hasil = data?.[0]
  const diproses = hasil?.diproses ?? 0
  const dilewati = hasil?.dilewati ?? 0

  revalidatePath("/dojo", "layout")

  if (diproses === 0) {
    return {
      galat:
        "Tidak ada yang bisa diverifikasi. Pastikan berkas wajibnya lengkap dan bukti transfernya sudah ada.",
      diproses,
      dilewati,
    }
  }

  return {
    sukses:
      dilewati > 0
        ? `${diproses} peserta terverifikasi, ${dilewati} dilewati karena belum lengkap.`
        : `${diproses} peserta terverifikasi.`,
    diproses,
    dilewati,
  }
}

export async function aksiTolakPeserta(
  pesertaId: string,
  alasan: string,
  jenisDitolak: string[],
  tolakPembayaran: boolean,
): Promise<StatusAksi> {
  await wajibPeran("dojo")

  if (!alasan.trim()) {
    return { galat: "Alasan penolakan wajib diisi." }
  }

  const supabase = await buatKlienServer()

  const { error } = await supabase.rpc("tolak_peserta", {
    p_peserta_id: pesertaId,
    p_alasan: alasan.trim(),
    p_jenis_ditolak: jenisDitolak as JenisBerkas[],
    p_tolak_pembayaran: tolakPembayaran,
  })

  if (error) return { galat: error.message }

  revalidatePath("/dojo", "layout")
  return { sukses: "Pendaftaran dikembalikan ke peserta untuk diperbaiki." }
}

export async function aksiKunciBatch(
  eventId: string,
  tingkatId: string,
): Promise<StatusAksi & { noAwal?: number; noAkhir?: number }> {
  const pengguna = await wajibPeran("dojo")

  if (!pengguna.dojoId) {
    return { galat: "Akun ini belum terhubung ke dojo mana pun." }
  }

  const supabase = await buatKlienServer()

  const { data, error } = await supabase.rpc("terbitkan_nomor_dada", {
    p_event_id: eventId,
    p_tingkat_id: tingkatId,
    p_dojo_id: pengguna.dojoId,
  })

  if (error) return { galat: error.message }

  const hasil = data?.[0]

  revalidatePath("/dojo", "layout")

  return {
    sukses: `${hasil?.jumlah ?? 0} nomor dada terbit.`,
    noAwal: hasil?.no_awal,
    noAkhir: hasil?.no_akhir,
  }
}
