import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import type { Database } from "./database.types"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env"

/**
 * Klien untuk Server Component, Server Action, dan Route Handler.
 * Tetap tunduk pada RLS — inilah yang dipakai di hampir semua tempat.
 *
 * Harus dibuat baru setiap request; jangan disimpan di variabel modul.
 */
export async function buatKlienServer() {
  const cookieStore = await cookies()

  return createServerClient<Database>(SUPABASE_URL(), SUPABASE_PUBLISHABLE_KEY(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Component tidak boleh menulis cookie. Penyegaran token
          // ditangani proxy.ts, jadi diam di sini memang yang benar.
        }
      },
    },
  })
}
