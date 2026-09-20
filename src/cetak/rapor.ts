import { esc } from "@/lib/cetak/html"

/** Template rapor / rekap nilai. A4 potret, dikelompokkan per dojo. */

export type BarisRapor = {
  id: string
  noDada: string
  nama: string
  nilai: number | null
  hadir: boolean
  status: string
}

export type KelompokRapor = {
  dojo: string
  kodeDojo: string
  baris: BarisRapor[]
}

export type IsiRapor = {
  event: string
  tanggal: string
  lokasi: string | null
  tingkat: string
  kodeTingkat: string
  batasLulus: number
  kelompok: KelompokRapor[]
}

export const gayaRapor = `
  @page { size: A4 portrait; margin: 14mm 12mm; }
  .kepala { border-bottom: 0.8mm solid #CE1126; padding-bottom: 3mm; margin-bottom: 5mm; }
  .lembaga { font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: #6b6b6b; }
  .judul { font-size: 15pt; font-weight: 800; margin-top: 1mm; }
  .sub { font-size: 9pt; color: #4a4a4a; margin-top: 1mm; line-height: 1.5; }
  .dojo { margin-top: 6mm; page-break-inside: avoid; }
  .dojo-nama { font-size: 11pt; font-weight: 700; margin-bottom: 2mm; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  thead { display: table-header-group; }
  th {
    text-align: left; font-size: 7.5pt; text-transform: uppercase;
    letter-spacing: 0.06em; color: #6b6b6b; font-weight: 600;
    border-bottom: 0.4mm solid #141414; padding: 1.5mm 2mm;
  }
  td { padding: 1.8mm 2mm; border-bottom: 0.2mm solid #e0e0e0; }
  tr { page-break-inside: avoid; }
  .kanan { text-align: right; }
  .nilai { font-weight: 700; }
  .gagal { color: #CE1126; font-weight: 600; }
  .kaki { margin-top: 10mm; font-size: 8pt; color: #8a8a8a; border-top: 0.2mm solid #e0e0e0; padding-top: 2mm; }
`

const LABEL: Record<string, string> = {
  lulus: "Lulus",
  tidak_lulus: "Tidak lulus",
  dinilai: "Sudah dinilai",
  layak_ujian: "Belum dinilai",
}

function baris(b: BarisRapor): string {
  const label = !b.hadir ? "Tidak hadir" : (LABEL[b.status] ?? b.status)
  const kelas = b.status === "lulus" ? "" : "gagal"

  return `
    <tr>
      <td class="mono">${esc(b.noDada)}</td>
      <td>${esc(b.nama)}</td>
      <td class="kanan nilai">${b.hadir ? esc(b.nilai ?? "—") : "—"}</td>
      <td class="${kelas}">${esc(label)}</td>
    </tr>`
}

function kelompok(k: KelompokRapor): string {
  return `
    <div class="dojo">
      <div class="dojo-nama">
        ${esc(k.dojo)}
        <span style="color:#8a8a8a; font-weight:400">(${k.baris.length} peserta)</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:22mm">Nomor</th>
            <th>Nama</th>
            <th class="kanan" style="width:18mm">Nilai</th>
            <th style="width:28mm">Status</th>
          </tr>
        </thead>
        <tbody>${k.baris.map(baris).join("")}</tbody>
      </table>
    </div>`
}

export function lembarRapor(isi: IsiRapor): string {
  const semua = isi.kelompok.flatMap((k) => k.baris)
  const lulus = semua.filter((b) => b.status === "lulus").length
  const tidakHadir = semua.filter((b) => !b.hadir).length

  return `
    <div class="kepala">
      <div class="lembaga">Kushin Ryu M Karate-Do Indonesia</div>
      <div class="judul">Rekap Nilai — ${esc(isi.kodeTingkat)} · ${esc(isi.tingkat)}</div>
      <div class="sub">
        ${esc(isi.event)}${isi.lokasi ? ` · ${esc(isi.lokasi)}` : ""} · ${esc(isi.tanggal)}
        <br />
        Batas lulus ${esc(isi.batasLulus)} · ${semua.length} peserta ·
        ${lulus} lulus · ${semua.length - lulus} tidak lulus${
          tidakHadir > 0 ? ` · ${tidakHadir} tidak hadir` : ""
        }
      </div>
    </div>
    ${isi.kelompok.map(kelompok).join("")}
    <div class="kaki">
      Dicetak dari SIKAT · nilai bersumber dari penilaian yang sudah dikunci kontingen.
    </div>`
}
