import { pencetak, tanggalPanjang } from "@/lib/cetak/izin"
import {
  balasGalat,
  balasHtml,
  balasPdf,
  jadikanDokumen,
  jadikanPdf,
} from "@/lib/cetak/render"
import { buatQr, getPesertaCetak } from "@/lib/data/cetak"
import { gayaKartu, lembarKartu, type Kartu } from "@/cetak/kartu-peserta"

/**
 * Kartu peserta — satu-satunya cetakan yang justru dibuat SEBELUM hari-H,
 * jadi tidak menunggu hasil ditutup. Yang dibutuhkan hanya nomor dada,
 * dan itu terbit saat dojo mengunci batch.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const tingkatId = url.searchParams.get("tingkat")

  if (!tingkatId) return balasGalat("Parameter tingkat wajib diisi.")

  const izin = await pencetak(url.searchParams.get("dojo"))
  if (!izin) return balasGalat("Tidak berwenang mencetak.", 403)

  const peserta = await getPesertaCetak(tingkatId, izin.dojoId ?? undefined)

  if (peserta.length === 0) {
    return balasGalat(
      "Tidak ada peserta bernomor dada di tingkat ini. Kunci batchnya lebih dulu.",
      404,
    )
  }

  const kartu: Kartu[] = await Promise.all(
    peserta.map(async (p) => ({
      id: p.id,
      noDada: p.no_dada ?? "",
      nama: p.nama_lengkap,
      dojo: p.dojo?.nama ?? "—",
      kodeTingkat: p.tingkat?.kode ?? "—",
      sabuk: `${p.tingkat?.sabuk_asal} → ${p.tingkat?.sabuk_tujuan}`,
      event: p.event_ujian?.nama ?? "—",
      tanggal: tanggalPanjang(p.event_ujian?.tanggal),
      qr: await buatQr(p.id),
    })),
  )

  const isi = lembarKartu(kartu)

  if (url.searchParams.get("pratinjau") === "1") {
    return balasHtml(jadikanDokumen(isi, gayaKartu))
  }

  const pdf = await jadikanPdf(isi, gayaKartu)
  const kode = peserta[0]?.tingkat?.kode ?? "kartu"

  return balasPdf(pdf, `kartu-peserta-${kode}.pdf`)
}
