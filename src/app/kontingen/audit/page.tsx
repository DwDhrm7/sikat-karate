import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuditLog } from "@/lib/data/kontingen"

export const metadata = { title: "Audit Log — SIKAT" }

const TABEL = [
  "peserta",
  "berkas_peserta",
  "pembayaran",
  "penilaian",
  "batch_dojo",
  "penguji_tugas",
  "tingkat",
  "profiles",
]

const AKSI = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "terbitkan_nomor_dada",
  "verifikasi_massal",
]

function satu(nilai: string | string[] | undefined): string | undefined {
  return Array.isArray(nilai) ? nilai[0] : nilai
}

const gayaSelect =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-52"

/** Ringkas perubahan jadi daftar kolom yang benar-benar berubah. */
function ringkasPerubahan(lama: unknown, baru: unknown): string {
  if (!baru || typeof baru !== "object") return "—"
  if (!lama || typeof lama !== "object") {
    return Object.keys(baru as Record<string, unknown>)
      .slice(0, 4)
      .join(", ")
  }

  const a = lama as Record<string, unknown>
  const b = baru as Record<string, unknown>
  const berubah = Object.keys(b).filter(
    (k) => k !== "updated_at" && JSON.stringify(a[k]) !== JSON.stringify(b[k]),
  )

  if (berubah.length === 0) return "—"

  return berubah
    .slice(0, 3)
    .map((k) => `${k}: ${JSON.stringify(a[k])} → ${JSON.stringify(b[k])}`)
    .join(" · ")
}

export default async function HalamanAudit({ searchParams }: PageProps<"/kontingen/audit">) {
  const sp = await searchParams
  const aksi = satu(sp.aksi)
  const tabel = satu(sp.tabel)
  const hari = satu(sp.hari)

  const baris = await getAuditLog({
    aksi,
    tabel,
    hari: hari ? Number(hari) : undefined,
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Audit log</h1>
        <p className="text-muted-foreground">
          200 kejadian terbaru. Perubahan nilai setelah hasil ditutup tercatat di
          sini.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="aksi">Aksi</Label>
          <select id="aksi" name="aksi" defaultValue={aksi ?? ""} className={gayaSelect}>
            <option value="">Semua aksi</option>
            {AKSI.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tabel">Tabel</Label>
          <select id="tabel" name="tabel" defaultValue={tabel ?? ""} className={gayaSelect}>
            <option value="">Semua tabel</option>
            {TABEL.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hari">Rentang (hari terakhir)</Label>
          <Input
            id="hari"
            name="hari"
            type="number"
            min={1}
            max={365}
            defaultValue={hari ?? ""}
            placeholder="misal 7"
            className="h-11 sm:w-40"
          />
        </div>

        <button
          type="submit"
          className="h-11 rounded-lg bg-foreground px-5 text-sm font-medium text-background"
        >
          Saring
        </button>
      </form>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{baris.length} kejadian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium whitespace-nowrap">Waktu</th>
                  <th className="py-2 pr-4 font-medium">Aktor</th>
                  <th className="py-2 pr-4 font-medium">Aksi</th>
                  <th className="py-2 pr-4 font-medium">Tabel</th>
                  <th className="py-2 font-medium">Perubahan</th>
                </tr>
              </thead>
              <tbody>
                {baris.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0 align-top">
                    <td className="py-2.5 pr-4 whitespace-nowrap tabular-nums">
                      {new Date(b.waktu).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 pr-4">{b.namaAktor}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{b.aksi}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{b.nama_tabel}</td>
                    <td className="py-2.5 font-mono text-xs break-all text-muted-foreground">
                      {ringkasPerubahan(b.data_lama, b.data_baru)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {baris.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Tidak ada kejadian yang cocok.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
