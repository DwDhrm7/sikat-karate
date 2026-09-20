import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPesertaDojo, getRingkasanDojo } from "@/lib/data/dojo"
import { LABEL_STATUS_PESERTA, type StatusPeserta } from "@/lib/status"

import { TabelPeserta } from "./tabel-peserta"

export const metadata = { title: "Peserta Dojo — SIKAT" }

const STATUS_PILIHAN: StatusPeserta[] = [
  "draft",
  "menunggu_verifikasi",
  "ditolak",
  "terverifikasi",
  "layak_ujian",
  "dinilai",
  "lulus",
  "tidak_lulus",
  "batal",
]

function satu(nilai: string | string[] | undefined): string | undefined {
  return Array.isArray(nilai) ? nilai[0] : nilai
}

const gayaSelect =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-56"

export default async function HalamanPesertaDojo({
  searchParams,
}: PageProps<"/dojo/peserta">) {
  const sp = await searchParams
  const status = satu(sp.status) as StatusPeserta | undefined
  const tingkat = satu(sp.tingkat)
  const q = satu(sp.q)

  const [baris, ringkasan] = await Promise.all([
    getPesertaDojo({ status, tingkat, q }),
    getRingkasanDojo(),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Peserta</h1>
        <p className="text-muted-foreground">
          Centang beberapa baris sekaligus, lalu setujui dalam satu tekan.
        </p>
      </div>

      {/* Saringan sengaja berupa form GET biasa: tersimpan di URL, bisa
          di-bookmark, dan tetap bekerja tanpa JavaScript. */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue={status ?? ""} className={gayaSelect}>
            <option value="">Semua status</option>
            {STATUS_PILIHAN.map((s) => (
              <option key={s} value={s}>
                {LABEL_STATUS_PESERTA[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tingkat">Tingkat</Label>
          <select id="tingkat" name="tingkat" defaultValue={tingkat ?? ""} className={gayaSelect}>
            <option value="">Semua tingkat</option>
            {ringkasan.map((t) => (
              <option key={t.tingkatId} value={t.tingkatId}>
                {t.kode} · {t.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q">Cari nama</Label>
          <Input
            id="q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="mis. Gede"
            className="h-11 sm:w-56"
          />
        </div>

        <button
          type="submit"
          className="h-11 rounded-lg bg-foreground px-5 text-sm font-medium text-background"
        >
          Saring
        </button>
      </form>

      <p className="text-sm text-muted-foreground">
        {baris.length} peserta ditampilkan
      </p>

      <TabelPeserta baris={baris} />
    </div>
  )
}
