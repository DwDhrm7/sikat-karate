/**
 * Setiap variabel HARUS disebut sebagai process.env.NAMA_LITERAL.
 *
 * Next mengganti rujukan NEXT_PUBLIC_* menjadi nilainya saat kompilasi, dan
 * penggantian itu hanya terjadi pada penyebutan statis. process.env[nama]
 * dengan kunci dinamis lolos dari penggantian, sehingga di peramban nilainya
 * undefined — server tetap jalan, klien diam-diam mati.
 */
function wajib(nama: string, nilai: string | undefined): string {
  if (!nilai) {
    throw new Error(
      `Variabel lingkungan ${nama} belum diisi. Salin .env.example ke .env.local lalu lengkapi.`,
    )
  }
  return nilai
}

export const SUPABASE_URL = () =>
  wajib("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)

export const SUPABASE_PUBLISHABLE_KEY = () =>
  wajib(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )

export const SUPABASE_SERVICE_ROLE_KEY = () =>
  wajib("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY)
