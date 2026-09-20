import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /**
   * Puppeteer memuat Chromium lewat require dinamis dan berkas biner, yang
   * tidak bisa ikut dibundel. Biarkan Node yang memuatnya sendiri saat
   * runtime.
   */
  serverExternalPackages: ["puppeteer", "puppeteer-core"],
}

export default nextConfig
