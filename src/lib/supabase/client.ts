"use client"

import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "./database.types"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env"

/** Klien untuk komponen klien. Tunduk pada RLS sebagai pengguna yang login. */
export function buatKlienBrowser() {
  return createBrowserClient<Database>(SUPABASE_URL(), SUPABASE_PUBLISHABLE_KEY())
}
