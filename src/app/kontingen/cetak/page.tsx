import { Lencana } from "@/components/lencana"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRingkasanCetak } from "@/lib/data/kontingen"
import { cn } from "@/lib/utils"

export const metadata = { title: "Pusat Cetak — SIKAT" }

function TautanCetak({
  href,
  anak,
  mati,
  alasan,
}: {
  href: string
  anak: string
  mati?: boolean
  alasan?: string
}) {
  if (mati) {
    return (
      <span
        title={alasan}
        className="inline-flex h-10 cursor-not-allowed items-center rounded-lg border border-border px-3 text-sm text-muted-foreground opacity-60"
      >
        {anak}
      </span>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex h-10 items-center rounded-lg border-2 border-foreground px-3 text-sm font-medium",
        "hover:bg-foreground hover:text-background",
      )}
    >
      {anak}
    </a>
  )
}

export default async function HalamanCetak() {
  const ringkasan = await getRingkasanCetak()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pusat cetak</h1>
        <p className="text-muted-foreground">
          Semua berkas terbuka sebagai PDF di tab baru.
        </p>
      </div>

      <Alert>
        <AlertDescription>
          Kartu peserta dicetak sebelum hari-H, begitu batch dikunci. Sertifikat
          dan rekap nilai baru terbuka setelah hasil tingkatnya ditutup.
        </AlertDescription>
      </Alert>

      {ringkasan.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada peserta bernomor dada. Nomor terbit saat dojo mengunci
            batch.
          </CardContent>
        </Card>
      ) : null}

      {ringkasan.map((t) => {
        const belumDitutup = !t.hasilDitutup
        const alasan = "Tutup hasil tingkat ini lebih dulu."

        return (
          <Card key={t.tingkatId}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    <span className="font-mono">{t.kode}</span> · {t.nama}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t.total} peserta bernomor
                    {t.hasilDitutup ? ` · ${t.lulus} lulus` : ""}
                  </p>
                </div>
                <Lencana nada={t.hasilDitutup ? "baik" : "netral"}>
                  {t.hasilDitutup ? "Hasil ditutup" : "Hasil terbuka"}
                </Lencana>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Seluruh dojo
                </p>
                <div className="flex flex-wrap gap-2">
                  <TautanCetak
                    href={`/api/cetak/kartu?tingkat=${t.tingkatId}`}
                    anak={`Kartu peserta (${t.total})`}
                  />
                  <TautanCetak
                    href={`/api/cetak/sertifikat?tingkat=${t.tingkatId}`}
                    anak={`Sertifikat (${t.lulus})`}
                    mati={belumDitutup || t.lulus === 0}
                    alasan={belumDitutup ? alasan : "Belum ada yang lulus."}
                  />
                  <TautanCetak
                    href={`/api/cetak/rapor?tingkat=${t.tingkatId}`}
                    anak="Rekap nilai"
                    mati={belumDitutup}
                    alasan={alasan}
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Per dojo
                </p>
                <div className="space-y-2">
                  {t.perDojo.map((d) => (
                    <div
                      key={d.dojoId}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0"
                    >
                      <span className="text-sm">
                        {d.nama}{" "}
                        <span className="text-muted-foreground">
                          ({d.jumlah} peserta
                          {t.hasilDitutup ? `, ${d.lulus} lulus` : ""})
                        </span>
                      </span>
                      <span className="flex flex-wrap gap-2">
                        <TautanCetak
                          href={`/api/cetak/kartu?tingkat=${t.tingkatId}&dojo=${d.dojoId}`}
                          anak="Kartu"
                        />
                        <TautanCetak
                          href={`/api/cetak/sertifikat?tingkat=${t.tingkatId}&dojo=${d.dojoId}`}
                          anak="Sertifikat"
                          mati={belumDitutup || d.lulus === 0}
                          alasan={belumDitutup ? alasan : "Belum ada yang lulus."}
                        />
                        <TautanCetak
                          href={`/api/cetak/rapor?tingkat=${t.tingkatId}&dojo=${d.dojoId}`}
                          anak="Rekap"
                          mati={belumDitutup}
                          alasan={alasan}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
