import { pencetak, tanggalPanjang } from "@/lib/cetak/izin"
import {
  balasGalat,
  balasHtml,
  balasPdf,
  jadikanDokumen,
  jadikanPdf,
} from "@/lib/cetak/render"
import { getPesertaCetak } from "@/lib/data/cetak"
import { gayaSertifikat, lembarSertifikat, type IsiSertifikat } from "@/cetak/sertifikat"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const tingkatId = url.searchParams.get("tingkat")

  if (!tingkatId) return balasGalat("Parameter tingkat wajib diisi.")

  const izin = await pencetak(url.searchParams.get("dojo"))
  if (!izin) return balasGalat("Tidak berwenang mencetak.", 403)

  const peserta = await getPesertaCetak(tingkatId, izin.dojoId ?? undefined, true)

  if (peserta.length === 0) {
    return balasGalat("Tidak ada peserta yang lulus di tingkat ini.", 404)
  }

  // Penjagaan ganda: status 'lulus' hanya ada setelah hasil ditutup, tapi
  // memeriksanya terang-terangan membuat aturannya terbaca di sini juga.
  if (!peserta[0]?.tingkat?.hasil_ditutup) {
    return balasGalat(
      "Sertifikat baru bisa dicetak setelah kontingen menutup hasil tingkat ini.",
      409,
    )
  }

  const isi: IsiSertifikat[] = peserta.map((p) => ({
    id: p.id,
    noDada: p.no_dada ?? "",
    nama: p.nama_lengkap,
    dojo: p.dojo?.nama ?? "—",
    namaKetua: p.dojo?.nama_ketua ?? null,
    sabukAsal: p.tingkat?.sabuk_asal ?? "—",
    sabukTujuan: p.tingkat?.sabuk_tujuan ?? "—",
    nilai: p.penilaian?.nilai ?? null,
    event: p.event_ujian?.nama ?? "—",
    tanggal: tanggalPanjang(p.event_ujian?.tanggal),
    lokasi: p.event_ujian?.lokasi ?? null,
  }))

  const dokumen = lembarSertifikat(isi)

  if (url.searchParams.get("pratinjau") === "1") {
    return balasHtml(jadikanDokumen(dokumen, gayaSertifikat))
  }

  const pdf = await jadikanPdf(dokumen, gayaSertifikat)
  const kode = peserta[0]?.tingkat?.kode ?? "sertifikat"

  return balasPdf(pdf, `sertifikat-${kode}.pdf`)
}
