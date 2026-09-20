/**
 * Alat bantu pengembangan: mencetak header Cookie untuk satu akun uji,
 * memakai serialisasi @supabase/ssr yang sama dengan aplikasi.
 *
 *   node scripts/sesi-uji.mjs penguji1@sikat.test sikat123
 *   curl -H "Cookie: $(node scripts/sesi-uji.mjs ...)" http://localhost:3000/penguji
 */
import { createServerClient } from "@supabase/ssr"

const [email, sandi] = process.argv.slice(2)

if (!email || !sandi) {
  console.error("Pakai: node scripts/sesi-uji.mjs <email> <kata_sandi>")
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const kunci = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!url || !kunci) {
  console.error("Isi dulu NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  process.exit(1)
}

const jar = new Map()

const supabase = createServerClient(url, kunci, {
  cookies: {
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    setAll: (cookies) => {
      for (const c of cookies) jar.set(c.name, c.value)
    },
  },
})

const { error } = await supabase.auth.signInWithPassword({ email, password: sandi })

if (error) {
  console.error("GAGAL:", error.message)
  process.exit(1)
}

console.log([...jar.entries()].map(([n, v]) => `${n}=${encodeURIComponent(v)}`).join("; "))
