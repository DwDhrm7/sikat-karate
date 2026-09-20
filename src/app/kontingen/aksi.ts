"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { wajibPeran } from "@/lib/auth/sesi"
import {
  SkemaAkun,
  SkemaDojo,
  SkemaEvent,
  SkemaStatusEvent,
  SkemaTingkat,
  SkemaTugas,
} from "@/lib/skema/kontingen"
import { buatKlienAdmin } from "@/lib/supabase/admin"
import { buatKlienServer } from "@/lib/supabase/server"

export type StatusAksi = {
  galat?: string
  sukses?: string
  galatField?: Record<string, string[] | undefined>
}

function galatUnik(pesan: string, bawaan: string): string {
  return pesan.includes("duplicate key") ? bawaan : pesan
}

export async function aksiBuatEvent(
  _sebelumnya: StatusAksi,
  formData: FormData,
): Promise<StatusAksi> {
  await wajibPeran("kontingen")
  const hasil = SkemaEvent.safeParse(Object.fromEntries(formData))

  if (!hasil.success) return { galatField: z.flattenError(hasil.error).fieldErrors }

  const supabase = await buatKlienServer()
  const { error } = await supabase.from("event_ujian").insert({
    nama: hasil.data.nama,
    tanggal: hasil.data.tanggal,
    lokasi: hasil.data.lokasi || null,
  })

  if (error) return { galat: error.message }

  revalidatePath("/kontingen", "layout")
  return { sukses: "Event dibuat sebagai draf. Buka pendaftarannya kalau sudah siap." }
}

export async function aksiUbahStatusEvent(
  eventId: string,
  status: string,
): Promise<StatusAksi> {
  await wajibPeran("kontingen")
  const hasil = SkemaStatusEvent.safeParse({ event_id: eventId, status })

  if (!hasil.success) return { galat: "Status tidak dikenal." }

  const supabase = await buatKlienServer()
  const { error } = await supabase
    .from("event_ujian")
    .update({ status: hasil.data.status })
    .eq("id", hasil.data.event_id)

  if (error) return { galat: error.message }

  revalidatePath("/", "layout")
  return { sukses: "Status event diperbarui." }
}

export async function aksiSimpanTingkat(
  _sebelumnya: StatusAksi,
  formData: FormData,
): Promise<StatusAksi> {
  await wajibPeran("kontingen")

  const mentah = Object.fromEntries(formData)
  const tingkatId = typeof mentah.tingkat_id === "string" ? mentah.tingkat_id : ""

  const hasil = SkemaTingkat.safeParse({
    ...mentah,
    wajib_sertifikat_terakhir: mentah.wajib_sertifikat_terakhir === "on",
  })

  if (!hasil.success) return { galatField: z.flattenError(hasil.error).fieldErrors }

  const supabase = await buatKlienServer()
  const isi = hasil.data

  if (tingkatId) {
    // Kode tidak ikut diubah: nomor dada yang sudah terbit memakainya.
    const { error } = await supabase
      .from("tingkat")
      .update({
        nama: isi.nama,
        sabuk_asal: isi.sabuk_asal,
        sabuk_tujuan: isi.sabuk_tujuan,
        biaya: isi.biaya,
        nilai_bawaan: isi.nilai_bawaan,
        batas_lulus: isi.batas_lulus,
        urutan: isi.urutan,
        wajib_sertifikat_terakhir: isi.wajib_sertifikat_terakhir,
      })
      .eq("id", tingkatId)

    if (error) return { galat: error.message }

    revalidatePath("/", "layout")
    return { sukses: `Tingkat ${isi.kode} diperbarui.` }
  }

  const { error } = await supabase.from("tingkat").insert(isi)

  if (error) {
    return { galat: galatUnik(error.message, `Kode ${isi.kode} sudah dipakai di event ini.`) }
  }

  revalidatePath("/", "layout")
  return { sukses: `Tingkat ${isi.kode} ditambahkan.` }
}

export async function aksiBuatDojo(
  _sebelumnya: StatusAksi,
  formData: FormData,
): Promise<StatusAksi> {
  await wajibPeran("kontingen")
  const hasil = SkemaDojo.safeParse(Object.fromEntries(formData))

  if (!hasil.success) return { galatField: z.flattenError(hasil.error).fieldErrors }

  const supabase = await buatKlienServer()
  const { error } = await supabase.from("dojo").insert({
    nama: hasil.data.nama,
    kode: hasil.data.kode,
    kota: hasil.data.kota || null,
    nama_ketua: hasil.data.nama_ketua || null,
  })

  if (error) {
    return { galat: galatUnik(error.message, `Kode ${hasil.data.kode} sudah dipakai dojo lain.`) }
  }

  revalidatePath("/kontingen", "layout")
  return { sukses: `Dojo ${hasil.data.nama} ditambahkan.` }
}

/**
 * Pembuatan akun dojo dan penguji.
 *
 * Satu-satunya tempat di seluruh aplikasi yang memakai service_role, karena
 * membuat pengguna lain memang mustahil lewat RLS. Peran diberikan di sini,
 * tidak pernah dari metadata pendaftaran: handle_new_user() selalu memberi
 * 'peserta', lalu baris ini yang menaikkannya.
 */
export async function aksiBuatAkun(
  _sebelumnya: StatusAksi,
  formData: FormData,
): Promise<StatusAksi> {
  await wajibPeran("kontingen")

  const hasil = SkemaAkun.safeParse(Object.fromEntries(formData))
  if (!hasil.success) return { galatField: z.flattenError(hasil.error).fieldErrors }

  let admin
  try {
    admin = buatKlienAdmin()
  } catch {
    return {
      galat:
        "SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local. Ambil dari Dashboard > Project Settings > API keys.",
    }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: hasil.data.email,
    password: hasil.data.kata_sandi,
    email_confirm: true,
    user_metadata: { nama: hasil.data.nama },
  })

  if (error || !data.user) {
    return { galat: `Gagal membuat akun: ${error?.message ?? "tidak diketahui"}` }
  }

  const { error: galatProfil } = await admin
    .from("profiles")
    .update({
      peran: hasil.data.peran,
      nama: hasil.data.nama,
      dojo_id: hasil.data.peran === "dojo" ? (hasil.data.dojo_id as string) : null,
    })
    .eq("id", data.user.id)

  if (galatProfil) {
    // Jangan tinggalkan akun setengah jadi yang perannya masih 'peserta'.
    await admin.auth.admin.deleteUser(data.user.id)
    return { galat: `Gagal menyetel peran, akun dibatalkan: ${galatProfil.message}` }
  }

  revalidatePath("/kontingen", "layout")
  return { sukses: `Akun ${hasil.data.peran} untuk ${hasil.data.nama} dibuat.` }
}

export async function aksiTugaskanPenguji(
  _sebelumnya: StatusAksi,
  formData: FormData,
): Promise<StatusAksi> {
  await wajibPeran("kontingen")

  const hasil = SkemaTugas.safeParse(Object.fromEntries(formData))
  if (!hasil.success) return { galatField: z.flattenError(hasil.error).fieldErrors }

  const supabase = await buatKlienServer()

  const { data: tingkat } = await supabase
    .from("tingkat")
    .select("event_id")
    .eq("id", hasil.data.tingkat_id)
    .maybeSingle()

  if (!tingkat) return { galat: "Tingkat tidak ditemukan." }

  const awal = typeof hasil.data.no_awal === "number" ? hasil.data.no_awal : null
  const akhir = typeof hasil.data.no_akhir === "number" ? hasil.data.no_akhir : null

  const { error } = await supabase.from("penguji_tugas").insert({
    event_id: tingkat.event_id,
    tingkat_id: hasil.data.tingkat_id,
    penguji_user_id: hasil.data.penguji_user_id,
    no_awal: awal,
    no_akhir: akhir,
  })

  if (error) return { galat: error.message }

  revalidatePath("/kontingen", "layout")
  return {
    sukses: awal ? `Penugasan nomor ${awal}–${akhir} disimpan.` : "Penugasan seluruh tingkat disimpan.",
  }
}

export async function aksiHapusTugas(tugasId: string): Promise<StatusAksi> {
  await wajibPeran("kontingen")

  const supabase = await buatKlienServer()
  const { error } = await supabase.from("penguji_tugas").delete().eq("id", tugasId)

  if (error) return { galat: error.message }

  revalidatePath("/kontingen", "layout")
  return { sukses: "Penugasan dihapus." }
}
