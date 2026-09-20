"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { wajibPeran } from "@/lib/auth/sesi"
import { SkemaPendaftaran } from "@/lib/skema/peserta"
import { buatKlienServer } from "@/lib/supabase/server"

export type StatusAksi = {
  galat?: string
  sukses?: string
  galatField?: Record<string, string[] | undefined>
}

export async function aksiDaftarPeserta(
  _sebelumnya: StatusAksi,
  formData: FormData,
): Promise<StatusAksi> {
  const pengguna = await wajibPeran("peserta")
  const hasil = SkemaPendaftaran.safeParse(Object.fromEntries(formData))

  if (!hasil.success) {
    return { galatField: z.flattenError(hasil.error).fieldErrors }
  }

  const supabase = await buatKlienServer()

  const { data: tingkat } = await supabase
    .from("tingkat")
    .select("id, event_id, biaya, sabuk_asal, event_ujian ( status )")
    .eq("id", hasil.data.tingkat_id)
    .maybeSingle()

  if (!tingkat) {
    return { galat: "Tingkat tidak ditemukan." }
  }
  if (tingkat.event_ujian?.status !== "pendaftaran_dibuka") {
    return { galat: "Pendaftaran untuk event ini sudah ditutup." }
  }

  const { data: peserta, error } = await supabase
    .from("peserta")
    .insert({
      event_id: tingkat.event_id,
      tingkat_id: tingkat.id,
      user_id: pengguna.id,
      didaftarkan_oleh: pengguna.id,
      dojo_id: hasil.data.dojo_id,
      nama_lengkap: hasil.data.nama_lengkap,
      tgl_lahir: hasil.data.tgl_lahir,
      jenis_kelamin: hasil.data.jenis_kelamin,
      sabuk_sekarang: tingkat.sabuk_asal,
      status: "draft",
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { galat: "Kamu sudah terdaftar pada event ini." }
    }
    return { galat: `Gagal menyimpan pendaftaran: ${error.message}` }
  }

  // Nominal dikunci saat mendaftar, bukan saat membayar, supaya perubahan
  // biaya di kemudian hari tidak mengubah tagihan yang sudah terbit.
  const { error: galatBayar } = await supabase.from("pembayaran").insert({
    peserta_id: peserta.id,
    jumlah: tingkat.biaya,
  })

  if (galatBayar) {
    return { galat: `Pendaftaran tersimpan, tetapi tagihan gagal dibuat: ${galatBayar.message}` }
  }

  revalidatePath("/peserta", "layout")
  redirect("/peserta/berkas")
}
