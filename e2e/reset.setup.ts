import fs from "node:fs"
import path from "node:path"

import { expect, test as reset } from "@playwright/test"

/**
 * Mengembalikan data penilaian ke keadaan awal sebelum rangkaian uji jalan.
 *
 * Tanpa ini, nilai yang tersimpan pada putaran sebelumnya menjadi titik awal
 * putaran berikutnya, dan uji yang menyebut angka tertentu akan gagal pada
 * putaran kedua padahal aplikasinya benar.
 *
 * Hanya untuk basis data pengembangan.
 */
function bacaEnv() {
  const isi = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8")
  const ambil = (nama: string) =>
    isi.match(new RegExp(`^${nama}=(.*)$`, "m"))?.[1]?.trim().replace(/^"|"$/g, "") ?? ""

  return {
    url: ambil("NEXT_PUBLIC_SUPABASE_URL"),
    kunci: ambil("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  }
}

reset("kembalikan nilai ke keadaan awal", async ({ request }) => {
  const { url, kunci } = bacaEnv()
  expect(url, "NEXT_PUBLIC_SUPABASE_URL harus ada di .env.local").toBeTruthy()

  const masuk = await request.post(`${url}/auth/v1/token?grant_type=password`, {
    headers: { apikey: kunci, "Content-Type": "application/json" },
    data: { email: "kontingen@sikat.test", password: "sikat123" },
  })
  expect(masuk.ok()).toBeTruthy()

  const token = (await masuk.json()).access_token as string
  const kepala = { apikey: kunci, Authorization: `Bearer ${token}` }

  const hapus = await request.delete(`${url}/rest/v1/penilaian?id=not.is.null`, {
    headers: kepala,
  })
  expect(hapus.ok(), "gagal menghapus penilaian lama").toBeTruthy()

  const balik = await request.patch(`${url}/rest/v1/peserta?status=eq.dinilai`, {
    headers: { ...kepala, "Content-Type": "application/json" },
    data: { status: "layak_ujian" },
  })
  expect(balik.ok(), "gagal mengembalikan status peserta").toBeTruthy()
})
