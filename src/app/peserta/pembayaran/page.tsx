import { redirect } from "next/navigation"

import { Lencana } from "@/components/lencana"
import { Pengunggah } from "@/components/pengunggah"
import { PratinjauBerkas } from "@/components/pratinjau-berkas"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BUCKET_BUKTI, rupiah } from "@/lib/berkas"
import { getPendaftaranSaya, urlBerkas } from "@/lib/data/peserta"
import { LABEL_STATUS_PEMBAYARAN, NADA_STATUS_PEMBAYARAN } from "@/lib/status"

import { aksiCatatBukti } from "@/lib/aksi/berkas"

export const metadata = { title: "Pembayaran — SIKAT" }

const BISA_DIUBAH = ["draft", "ditolak", "menunggu_verifikasi"]

export default async function HalamanPembayaran() {
  const pendaftaran = await getPendaftaranSaya()

  if (!pendaftaran) redirect("/peserta")

  const pembayaran = pendaftaran.pembayaran
  const terkunci = !BISA_DIUBAH.includes(pendaftaran.status)
  const url = await urlBerkas(BUCKET_BUKTI, pembayaran?.path_bukti ?? null)
  const rekening = process.env.NEXT_PUBLIC_REKENING_TUJUAN ?? "—"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pembayaran</h1>
        <p className="text-muted-foreground">
          Transfer sesuai nominal, lalu unggah bukti transfernya.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-merek">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Yang harus dibayar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Tingkat {pendaftaran.tingkat?.kode} · {pendaftaran.tingkat?.nama}
              </p>
              <p className="text-4xl font-bold tabular-nums">
                {rupiah(pembayaran?.jumlah ?? pendaftaran.tingkat?.biaya ?? 0)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Rekening tujuan</p>
              <p className="font-medium">{rekening}</p>
            </div>

            <p className="text-xs text-muted-foreground">
              Transfer tepat sampai angka terakhir. Nominal yang berbeda
              memperlambat verifikasi dojo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-base">Bukti transfer</CardTitle>
              {pembayaran ? (
                <Lencana nada={NADA_STATUS_PEMBAYARAN[pembayaran.status]}>
                  {LABEL_STATUS_PEMBAYARAN[pembayaran.status]}
                </Lencana>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <PratinjauBerkas
              url={url}
              path={pembayaran?.path_bukti ?? null}
              alt="Bukti transfer"
            />

            {pembayaran?.status === "ditolak" && pembayaran.alasan_tolak ? (
              <Alert variant="destructive">
                <AlertTitle>Bukti ditolak</AlertTitle>
                <AlertDescription>{pembayaran.alasan_tolak}</AlertDescription>
              </Alert>
            ) : null}

            <Pengunggah
              pesertaId={pendaftaran.id}
              bucket={BUCKET_BUKTI}
              awalanNama="bukti-transfer"
              sudahAda={Boolean(pembayaran?.path_bukti)}
              terkunci={terkunci}
              catat={aksiCatatBukti.bind(null, pendaftaran.id)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
