import Link from "next/link"

import { Lencana } from "@/components/lencana"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRingkasanDojo } from "@/lib/data/dojo"
import { LABEL_STATUS_PESERTA, type StatusPeserta } from "@/lib/status"

import { KunciBatch } from "./kunci-batch"

export const metadata = { title: "Beranda Dojo — SIKAT" }

const URUTAN_STATUS: StatusPeserta[] = [
  "draft",
  "menunggu_verifikasi",
  "ditolak",
  "terverifikasi",
  "layak_ujian",
  "dinilai",
  "lulus",
  "tidak_lulus",
]

export default async function BerandaDojo() {
  const ringkasan = await getRingkasanDojo()

  const totalMenunggu = ringkasan.reduce(
    (n, t) => n + (t.perStatus.get("menunggu_verifikasi") ?? 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Beranda Dojo</h1>
          <p className="text-muted-foreground">
            Satu batch per tingkat. Nomor dada terbit saat batch dikunci.
          </p>
        </div>
        {totalMenunggu > 0 ? (
          <Link
            href="/dojo/peserta?status=menunggu_verifikasi"
            className={buttonVariants({ size: "lg" })}
          >
            Verifikasi {totalMenunggu} peserta
          </Link>
        ) : null}
      </div>

      {ringkasan.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada peserta di dojo ini.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {ringkasan.map((t) => {
          const dikunci = t.batch?.status === "dikunci"

          return (
            <Card key={t.tingkatId}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      <span className="font-mono">{t.kode}</span> · {t.nama}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t.total} peserta
                      {t.blokNomor
                        ? ` · nomor ${t.kode}-${String(t.blokNomor.awal).padStart(3, "0")} s/d ${t.kode}-${String(t.blokNomor.akhir).padStart(3, "0")}`
                        : ""}
                    </p>
                  </div>
                  <Lencana nada={dikunci ? "baik" : "netral"}>
                    {dikunci ? "Batch dikunci" : "Batch terbuka"}
                  </Lencana>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {URUTAN_STATUS.filter((s) => (t.perStatus.get(s) ?? 0) > 0).map((s) => (
                    <Link
                      key={s}
                      href={`/dojo/peserta?status=${s}&tingkat=${t.tingkatId}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs transition-colors hover:bg-accent"
                    >
                      <span className="text-muted-foreground">
                        {LABEL_STATUS_PESERTA[s]}
                      </span>
                      <span className="font-bold tabular-nums">
                        {t.perStatus.get(s)}
                      </span>
                    </Link>
                  ))}
                </div>

                <KunciBatch
                  eventId={t.eventId}
                  tingkatId={t.tingkatId}
                  kode={t.kode}
                  siapDikunci={t.siapDikunci}
                  menggantung={t.menggantung}
                />

                {t.blokNomor ? (
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/api/cetak/kartu?tingkat=${t.tingkatId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center rounded-lg border-2 border-foreground px-3 text-sm font-medium hover:bg-foreground hover:text-background"
                    >
                      Cetak kartu peserta
                    </a>
                    <a
                      href={`/api/cetak/rapor?tingkat=${t.tingkatId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center rounded-lg border border-border px-3 text-sm hover:bg-accent"
                    >
                      Rekap nilai
                    </a>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
