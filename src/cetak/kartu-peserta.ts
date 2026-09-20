import { esc } from "@/lib/cetak/html"

/**
 * Template kartu peserta. Murni tampilan — ganti bebas tanpa menyentuh
 * logika. Delapan kartu per A4 potret, 105 × 74,25 mm masing-masing.
 */

export type Kartu = {
  id: string
  noDada: string
  nama: string
  dojo: string
  kodeTingkat: string
  sabuk: string
  event: string
  tanggal: string
  qr: string
}

const PER_HALAMAN = 8

export const gayaKartu = `
  @page { size: A4 portrait; margin: 0; }
  .halaman {
    width: 210mm; height: 297mm;
    display: grid;
    grid-template-columns: 105mm 105mm;
    grid-template-rows: repeat(4, 74.25mm);
    page-break-after: always;
  }
  .halaman:last-child { page-break-after: auto; }
  .kartu {
    border: 0.3mm dashed #c9c9c9;
    padding: 6mm 6mm 5mm;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .kartu-atas {
    font-size: 7pt; letter-spacing: 0.06em; text-transform: uppercase;
    color: #6b6b6b; border-bottom: 0.6mm solid #CE1126; padding-bottom: 1.5mm;
  }
  .kartu-isi { display: flex; gap: 5mm; align-items: flex-start; }
  .nomor { font-size: 30pt; font-weight: 800; line-height: 1; letter-spacing: -0.02em; }
  .nama { font-size: 12pt; font-weight: 700; margin-top: 2mm; line-height: 1.2; }
  .rinci { font-size: 8pt; color: #4a4a4a; margin-top: 1mm; line-height: 1.5; }
  .qr { width: 22mm; height: 22mm; flex-shrink: 0; }
  .kartu-bawah { font-size: 6.5pt; color: #8a8a8a; }
`

function satuKartu(k: Kartu): string {
  return `
    <div class="kartu">
      <div class="kartu-atas">${esc(k.event)}</div>
      <div class="kartu-isi">
        <div style="flex:1; min-width:0">
          <div class="nomor mono merah">${esc(k.noDada)}</div>
          <div class="nama">${esc(k.nama)}</div>
          <div class="rinci">${esc(k.dojo)}<br />${esc(k.kodeTingkat)} · ${esc(k.sabuk)}</div>
        </div>
        <img class="qr" src="${esc(k.qr)}" alt="" />
      </div>
      <div class="kartu-bawah">${esc(k.tanggal)} · Bawa kartu ini pada hari ujian</div>
    </div>`
}

export function lembarKartu(kartu: Kartu[]): string {
  const halaman: Kartu[][] = []
  for (let i = 0; i < kartu.length; i += PER_HALAMAN) {
    halaman.push(kartu.slice(i, i + PER_HALAMAN))
  }

  return halaman
    .map((isi) => {
      // Sel kosong menjaga kisi tetap utuh di halaman terakhir
      const pengisi = "<div></div>".repeat(PER_HALAMAN - isi.length)
      return `<div class="halaman">${isi.map(satuKartu).join("")}${pengisi}</div>`
    })
    .join("")
}
