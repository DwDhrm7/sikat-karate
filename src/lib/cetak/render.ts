import "server-only"

import puppeteer, { type Browser, type PDFOptions } from "puppeteer"

/**
 * Satu instans peramban dipakai ulang antar permintaan. Menyalakan Chrome
 * makan sekitar satu detik; mencetak rapor lima dojo tidak perlu membayar
 * itu lima kali.
 */
let peramban: Promise<Browser> | null = null

async function ambilPeramban(): Promise<Browser> {
  if (!peramban) {
    peramban = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
    })
  }
  return peramban
}

const GAYA_DASAR = `
  @page { margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #141414;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .merah { color: #CE1126; }
  .mono { font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace; }
`

/**
 * Template cetak sengaja memakai CSS biasa, bukan Tailwind: halaman ini
 * dirender Chrome yang berdiri sendiri, tanpa pipeline build aplikasi.
 * Menggantinya cukup menyunting berkas di src/cetak/ tanpa menyentuh
 * logika apa pun.
 */
export function jadikanDokumen(isi: string, gaya: string): string {
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <style>${GAYA_DASAR}${gaya}</style>
  </head>
  <body>${isi}</body>
</html>`
}

/**
 * Pratinjau HTML dengan data sungguhan. Menyunting tata letak cetak lewat
 * PDF berarti menunggu Chrome setiap kali; dengan ini template bisa
 * diutak-atik dan dimuat ulang seperti halaman biasa.
 */
export function balasHtml(html: string): Response {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}

export async function jadikanPdf(
  isi: string,
  gaya: string,
  opsi: PDFOptions = {},
): Promise<Uint8Array> {
  const html = jadikanDokumen(isi, gaya)

  const halaman = await (await ambilPeramban()).newPage()

  try {
    await halaman.setContent(html, { waitUntil: "load" })
    return await halaman.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      ...opsi,
    })
  } finally {
    await halaman.close()
  }
}

export function balasPdf(pdf: Uint8Array, namaBerkas: string): Response {
  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${namaBerkas}"`,
      "Cache-Control": "no-store",
    },
  })
}

export function balasGalat(pesan: string, kode = 400): Response {
  return new Response(pesan, {
    status: kode,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
