import "server-only"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./env"

/**
 * Klien service_role: MELEWATI SELURUH RLS.
 *
 * Hanya untuk hal yang mustahil dilakukan pengguna biasa — pembuatan akun
 * dojo dan penguji oleh kontingen. Setiap pemakaian wajib memeriksa sendiri
 * bahwa pemanggilnya benar-benar kontingen, karena database tidak lagi
 * menjaga apa pun di jalur ini.
 */
export function buatKlienAdmin() {
  return createClient<Database>(SUPABASE_URL(), SUPABASE_SERVICE_ROLE_KEY(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
