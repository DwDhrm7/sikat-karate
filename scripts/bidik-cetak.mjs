/**
 * Alat bantu pengembangan: memotret pratinjau template cetak jadi PNG,
 * supaya tata letaknya bisa diperiksa tanpa membuka PDF berulang kali.
 *
 *   KUKI="$(node scripts/sesi-uji.mjs kontingen@sikat.test sikat123)" \
 *     node scripts/bidik-cetak.mjs \
 *     "http://localhost:3000/api/cetak/rapor?tingkat=<id>&pratinjau=1" \
 *     rapor.png 794 1123
 */
import puppeteer from "puppeteer"

const [url, keluar, lebar = "794", tinggi = "1123"] = process.argv.slice(2)

if (!url || !keluar) {
  console.error("Pakai: node scripts/bidik-cetak.mjs <url> <keluar.png> [lebar] [tinggi]")
  process.exit(1)
}

const peramban = await puppeteer.launch({ headless: true })

try {
  const halaman = await peramban.newPage()
  await halaman.setViewport({
    width: Number(lebar),
    height: Number(tinggi),
    deviceScaleFactor: 1,
  })

  const kuki = process.env.KUKI
  if (kuki) {
    const alamat = new URL(url)
    await peramban.setCookie(
      ...kuki.split("; ").map((k) => {
        const i = k.indexOf("=")
        return {
          name: k.slice(0, i),
          value: k.slice(i + 1),
          domain: alamat.hostname,
          path: "/",
        }
      }),
    )
  }

  await halaman.goto(url, { waitUntil: "networkidle0" })
  await halaman.screenshot({ path: keluar })
  console.log("tersimpan:", keluar)
} finally {
  await peramban.close()
}
