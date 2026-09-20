import Link from "next/link"

import { Lencana } from "@/components/lencana"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getProgresTingkat } from "@/lib/data/kontingen"

export const metadata = { title: "Progres — SIKAT" }

function Bilah({ nilai, dari }: { nilai: number; dari: number }) {
  const persen = dari === 0 ? 0 : Math.round((nilai / dari) * 100)

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">Sudah dinilai</span>
        <span className="font-medium tabular-nums">
          {nilai} dari {dari} · {persen}%
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={persen}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-foreground" style={{ width: `${persen}%` }} />
      </div>
    </div>
  )
}

export default async function HalamanProgres() {
  const progres = await getProgresTingkat()

  const adaMasalah = progres.filter(
    (t) => t.cakupan.length > 0 || t.dojoBelumKunci.length > 0,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progres per tingkat</h1>
        <p className="text-muted-foreground">
          Yang perlu diperhatikan sebelum hari-H ditandai merah.
        </p>
      </div>

      {adaMasalah.length === 0 && progres.length > 0 ? (
        <Alert>
          <AlertDescription>
            Semua batch sudah dikunci dan seluruh rentang nomor sudah tercakup
            penguji.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {progres.map((t) => (
          <Card key={t.tingkatId} className={t.cakupan.length > 0 ? "border-merek" : undefined}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    <span className="font-mono">{t.kode}</span> · {t.nama}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t.total} peserta · batas lulus {t.batasLulus} ·{" "}
                    {t.jumlahPenguji} penguji
                  </p>
                </div>
                <Lencana nada={t.hasilDitutup ? "baik" : "netral"}>
                  {t.hasilDitutup ? "Hasil ditutup" : "Hasil terbuka"}
                </Lencana>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <Bilah nilai={t.dinilai} dari={t.layak} />

              {t.cakupan.length > 0 ? (
                <Alert variant="destructive">
                  <AlertTitle>Rentang penguji bermasalah</AlertTitle>
                  <AlertDescription>
                    <ul className="list-inside list-disc">
                      {t.cakupan.map((c, i) => (
                        <li key={i}>
                          Nomor {c.dari}–{c.sampai}{" "}
                          {c.jenis === "kosong"
                            ? "belum dipegang penguji mana pun"
                            : "dipegang lebih dari satu penguji"}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              {t.dojoBelumKunci.length > 0 ? (
                <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
                  <p className="font-medium">Batch belum dikunci</p>
                  <p className="text-muted-foreground">
                    {t.dojoBelumKunci.map((d) => d.nama).join(", ")}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 text-xs">
                {[...t.perStatus.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, jumlah]) => (
                    <span
                      key={status}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1"
                    >
                      <span className="text-muted-foreground">{status}</span>
                      <span className="font-bold tabular-nums">{jumlah}</span>
                    </span>
                  ))}
              </div>

              <Link
                href="/kontingen/penguji"
                className="inline-block text-sm font-medium underline underline-offset-4"
              >
                Atur penugasan penguji →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {progres.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada peserta di event mana pun.
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
