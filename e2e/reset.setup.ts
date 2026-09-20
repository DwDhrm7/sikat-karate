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
const TINGKAT_PK = "22222222-2222-2222-2222-000000000001"

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

  // Hanya tingkat PK yang dipakai rangkaian uji. Tingkat lain — terutama
  // yang hasilnya sudah ditutup — tidak boleh ikut terhapus, karena
  // nilainya sudah final dan dipakai untuk mencetak sertifikat.
  const daftar = await request.get(
    `${url}/rest/v1/peserta?select=id&tingkat_id=eq.${TINGKAT_PK}`,
    { headers: kepala },
  )
  expect(daftar.ok(), "gagal memuat peserta PK").toBeTruthy()

  const ids = ((await daftar.json()) as { id: string }[]).map((p) => p.id)

  for (let i = 0; i < ids.length; i += 50) {
    const bagian = ids.slice(i, i + 50)
    const hapus = await request.delete(
      `${url}/rest/v1/penilaian?peserta_id=in.(${bagian.join(",")})`,
      { headers: kepala },
    )
    expect(hapus.ok(), "gagal menghapus penilaian lama").toBeTruthy()
  }

  const balik = await request.patch(
    `${url}/rest/v1/peserta?status=eq.dinilai&tingkat_id=eq.${TINGKAT_PK}`,
    {
      headers: { ...kepala, "Content-Type": "application/json" },
      data: { status: "layak_ujian" },
    },
  )
  expect(balik.ok(), "gagal mengembalikan status peserta").toBeTruthy()
})
