"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { SkemaDaftar, SkemaMasuk } from "@/lib/auth/skema"
import { buatKlienServer } from "@/lib/supabase/server"

export type StatusForm = {
  galat?: string
  sukses?: string
  galatField?: Record<string, string[] | undefined>
}

/**
 * Hanya menerima path internal. Tanpa ini, ?lanjut=https://situs-lain
 * mengubah halaman masuk menjadi batu loncatan phising.
 */
function tujuanAman(lanjut?: string): string {
  if (!lanjut) return "/"
  if (!lanjut.startsWith("/") || lanjut.startsWith("//")) return "/"
  return lanjut
}

export async function aksiMasuk(
  _sebelumnya: StatusForm,
  formData: FormData,
): Promise<StatusForm> {
  const hasil = SkemaMasuk.safeParse(Object.fromEntries(formData))

  if (!hasil.success) {
    return { galatField: z.flattenError(hasil.error).fieldErrors }
  }

  const supabase = await buatKlienServer()
  const { error } = await supabase.auth.signInWithPassword({
    email: hasil.data.email,
    password: hasil.data.kata_sandi,
  })

  if (error) {
    // Pesan sengaja tidak membedakan "email tidak ada" dan "sandi salah",
    // supaya halaman ini tidak bisa dipakai menebak daftar email terdaftar.
    return { galat: "Email atau kata sandi salah." }
  }

  revalidatePath("/", "layout")
  redirect(tujuanAman(hasil.data.lanjut))
}

export async function aksiDaftar(
  _sebelumnya: StatusForm,
  formData: FormData,
): Promise<StatusForm> {
  const hasil = SkemaDaftar.safeParse(Object.fromEntries(formData))

  if (!hasil.success) {
    return { galatField: z.flattenError(hasil.error).fieldErrors }
  }

  const supabase = await buatKlienServer()

  // peran tidak dikirim dari sini. Trigger handle_new_user() selalu
  // memberi 'peserta'; peran lain hanya bisa diberikan kontingen.
  const { data, error } = await supabase.auth.signUp({
    email: hasil.data.email,
    password: hasil.data.kata_sandi,
    options: {
      data: {
        nama: hasil.data.nama,
        no_hp: hasil.data.no_hp || null,
      },
    },
  })

  if (error) {
    if (error.code === "user_already_exists") {
      return { galat: "Email ini sudah terdaftar. Silakan masuk." }
    }
    if (error.code === "weak_password") {
      return { galat: "Kata sandi terlalu lemah. Pakai kombinasi yang lebih panjang." }
    }
    return { galat: `Pendaftaran gagal: ${error.message}` }
  }

  // Kalau konfirmasi email masih aktif di project, sesi belum terbit.
  if (!data.session) {
    return {
      sukses:
        "Akun berhasil dibuat. Cek kotak masuk email untuk tautan konfirmasi, lalu masuk.",
    }
  }

  revalidatePath("/", "layout")
  redirect("/peserta")
}

export async function aksiKeluar() {
  const supabase = await buatKlienServer()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/masuk")
}
