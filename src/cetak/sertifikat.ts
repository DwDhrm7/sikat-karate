import { esc } from "@/lib/cetak/html"

/** Template sertifikat. Satu lembar per peserta, A4 lanskap. */

export type IsiSertifikat = {
  id: string
  noDada: string
  nama: string
  dojo: string
  namaKetua: string | null
  sabukAsal: string
  sabukTujuan: string
  nilai: number | null
  event: string
  tanggal: string
  lokasi: string | null
}

export const gayaSertifikat = `
  @page { size: A4 landscape; margin: 0; }
  .lembar {
    width: 297mm; height: 210mm; padding: 18mm 22mm;
    display: flex; flex-direction: column;
    page-break-after: always; position: relative;
  }
  .lembar:last-child { page-break-after: auto; }
  .bingkai {
    position: absolute; inset: 12mm;
    border: 1.2mm solid #141414;
    outline: 0.4mm solid #CE1126; outline-offset: 2.5mm;
  }
  .isi { position: relative; display: flex; flex-direction: column; height: 100%; text-align: center; }
  .lembaga { font-size: 10pt; letter-spacing: 0.22em; text-transform: uppercase; color: #6b6b6b; }
  .judul { font-size: 30pt; font-weight: 800; letter-spacing: 0.04em; margin-top: 3mm; }
  .nomor-sertifikat { font-size: 9pt; color: #6b6b6b; margin-top: 1.5mm; }
  .pengantar { font-size: 11pt; margin-top: 10mm; }
  .nama {
    font-size: 26pt; font-weight: 700; margin-top: 3mm;
    border-bottom: 0.5mm solid #CE1126; display: inline-block; padding: 0 10mm 2mm;
  }
  .keterangan { font-size: 11.5pt; margin-top: 6mm; line-height: 1.7; }
  .sabuk { font-weight: 700; }
  .nilai { font-size: 13pt; font-weight: 700; margin-top: 4mm; }
  .tanggal { margin-top: auto; font-size: 10pt; color: #4a4a4a; }
  .ttd { margin-top: 6mm; display: flex; justify-content: space-between; padding: 0 8mm; font-size: 10pt; }
  .ttd-kotak { width: 65mm; }
  .ttd-garis { margin-top: 20mm; border-top: 0.4mm solid #141414; padding-top: 1.5mm; font-weight: 600; }
  .ttd-peran { font-size: 8.5pt; color: #6b6b6b; }
`

function satuSertifikat(s: IsiSertifikat): string {
  return `
    <div class="lembar">
      <div class="bingkai"></div>
      <div class="isi">
        <div class="lembaga">Kushin Ryu M Karate-Do Indonesia</div>
        <div class="judul">SERTIFIKAT KENAIKAN TINGKAT</div>
        <div class="nomor-sertifikat mono">Nomor: ${esc(s.noDada)}</div>

        <div class="pengantar">Diberikan kepada</div>
        <div><span class="nama">${esc(s.nama)}</span></div>

        <div class="keterangan">
          yang telah dinyatakan <strong>LULUS</strong> dalam ujian kenaikan tingkat
          dari sabuk <span class="sabuk">${esc(s.sabukAsal)}</span>
          ke sabuk <span class="sabuk">${esc(s.sabukTujuan)}</span>
          <br />${esc(s.event)}
        </div>

        ${s.nilai !== null ? `<div class="nilai">Nilai akhir: ${esc(s.nilai)}</div>` : ""}

        <div class="tanggal">
          ${esc(s.lokasi ?? "")}${s.lokasi ? ", " : ""}${esc(s.tanggal)}
        </div>

        <div class="ttd">
          <div class="ttd-kotak">
            <div class="ttd-garis">${esc(s.namaKetua ?? "")}&nbsp;</div>
            <div class="ttd-peran">Ketua ${esc(s.dojo)}</div>
          </div>
          <div class="ttd-kotak">
            <div class="ttd-garis">&nbsp;</div>
            <div class="ttd-peran">Ketua Kontingen</div>
          </div>
        </div>
      </div>
    </div>`
}

export function lembarSertifikat(isi: IsiSertifikat[]): string {
  return isi.map(satuSertifikat).join("")
}
