import { pencetak, tanggalPanjang } from "@/lib/cetak/izin"
import {
  balasGalat,
  balasHtml,
  balasPdf,
  jadikanDokumen,
  jadikanPdf,
} from "@/lib/cetak/render"
import { getPesertaCetak } from "@/lib/data/cetak"
import { gayaRapor, lembarRapor, type KelompokRapor } from "@/cetak/rapor"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const tingkatId = url.searchParams.get("tingkat")

  if (!tingkatId) return balasGalat("Parameter tingkat wajib diisi.")

  const izin = await pencetak(url.searchParams.get("dojo"))
  if (!izin) return balasGalat("Tidak berwenang mencetak.", 403)

  const peserta = await getPesertaCetak(tingkatId, izin.dojoId ?? undefined)

  if (peserta.length === 0) {
    return balasGalat("Tidak ada peserta bernomor dada di tingkat ini.", 404)
  }

  if (!peserta[0]?.tingkat?.hasil_ditutup) {
    return balasGalat(
      "Rekap nilai baru bisa dicetak setelah kontingen menutup hasil tingkat ini.",
      409,
    )
  }

  const perDojo = new Map<string, KelompokRapor>()

  for (const p of peserta) {
    const kode = p.dojo?.kode ?? "—"

    if (!perDojo.has(kode)) {
      perDojo.set(kode, { dojo: p.dojo?.nama ?? "—", kodeDojo: kode, baris: [] })
    }

    perDojo.get(kode)!.baris.push({
      id: p.id,
      noDada: p.no_dada ?? "",
      nama: p.nama_lengkap,
      nilai: p.penilaian?.nilai ?? null,
      hadir: p.penilaian?.hadir ?? false,
      status: p.status,
    })
  }

  const pertama = peserta[0]

  const isi = lembarRapor({
    event: pertama.event_ujian?.nama ?? "—",
    tanggal: tanggalPanjang(pertama.event_ujian?.tanggal),
    lokasi: pertama.event_ujian?.lokasi ?? null,
    tingkat: pertama.tingkat?.nama ?? "—",
    kodeTingkat: pertama.tingkat?.kode ?? "—",
    batasLulus: pertama.tingkat?.batas_lulus ?? 0,
    kelompok: [...perDojo.values()].sort((a, b) => a.dojo.localeCompare(b.dojo)),
  })

  if (url.searchParams.get("pratinjau") === "1") {
    return balasHtml(jadikanDokumen(isi, gayaRapor))
  }

  const pdf = await jadikanPdf(isi, gayaRapor)

  return balasPdf(pdf, `rekap-nilai-${pertama.tingkat?.kode ?? "tingkat"}.pdf`)
}
