import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Proxy (dulu bernama middleware sebelum Next 16) menyegarkan sesi Supabase
 * di setiap request.
 *
 * Yang dikerjakan di sini hanya pemeriksaan optimistik "sudah login atau
 * belum". Keputusan peran TIDAK diambil di sini: proxy berjalan pada setiap
 * rute termasuk yang di-prefetch, dan membaca profil dari database di jalur
 * ini akan mahal sekaligus tidak bisa dipercaya sebagai pagar terakhir.
 * Pagar sesungguhnya ada di layout tiap peran dan di RLS.
 */

const RUTE_PUBLIK = ["/masuk", "/daftar", "/tidak-berwenang"]

export async function proxy(request: NextRequest) {
  let cookiesTerbaru: { name: string; value: string; options: CookieOptions }[] = []
  let headerTambahan: Record<string, string> = {}

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesTerbaru = cookiesToSet
          headerTambahan = headers
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
        },
      },
    },
  )

  /**
   * Cookie hasil penyegaran token harus menempel pada response apa pun yang
   * kita kembalikan — termasuk redirect. Kalau tertinggal, token baru tidak
   * pernah sampai ke browser dan sesi terjebak menyegarkan dirinya terus.
   *
   * headerTambahan berisi Cache-Control yang diwajibkan @supabase/ssr supaya
   * response bercookie sesi tidak ikut ter-cache CDN.
   */
  const siapkan = (response: NextResponse) => {
    for (const { name, value, options } of cookiesTerbaru) {
      response.cookies.set(name, value, options)
    }
    for (const [nama, nilai] of Object.entries(headerTambahan)) {
      response.headers.set(nama, nilai)
    }
    return response
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const publik = RUTE_PUBLIK.some((rute) => path === rute || path.startsWith(`${rute}/`))

  if (!user && !publik) {
    const tujuan = request.nextUrl.clone()
    tujuan.pathname = "/masuk"
    tujuan.search = ""
    if (path !== "/") tujuan.searchParams.set("lanjut", path)
    return siapkan(NextResponse.redirect(tujuan))
  }

  if (user && (path === "/masuk" || path === "/daftar")) {
    const tujuan = request.nextUrl.clone()
    tujuan.pathname = "/"
    tujuan.search = ""
    return siapkan(NextResponse.redirect(tujuan))
  }

  return siapkan(NextResponse.next({ request }))
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
