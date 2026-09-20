import { redirect } from "next/navigation"

import { Lencana } from "@/components/lencana"
import { Pengunggah } from "@/components/pengunggah"
import { PratinjauBerkas } from "@/components/pratinjau-berkas"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BUCKET_BERKAS,
  LABEL_BERKAS,
  PETUNJUK_BERKAS,
  berkasDiperlukan,
} from "@/lib/berkas"
import { getPendaftaranSaya, urlBerkas } from "@/lib/data/peserta"
import { LABEL_STATUS_BERKAS, NADA_STATUS_BERKAS } from "@/lib/status"

import { aksiCatatBerkas } from "@/lib/aksi/berkas"

export const metadata = { title: "Berkas Persyaratan — SIKAT" }

const BISA_DIUBAH = ["draft", "ditolak", "menunggu_verifikasi"]

export default async function HalamanBerkas() {
  const pendaftaran = await getPendaftaranSaya()

  if (!pendaftaran) redirect("/peserta")

  const terkunci = !BISA_DIUBAH.includes(pendaftaran.status)
  const perlu = berkasDiperlukan(pendaftaran.tingkat?.wajib_sertifikat_terakhir ?? true)

  const kartu = await Promise.all(
    perlu.map(async (jenis) => {
      const berkas = pendaftaran.berkas_peserta.find((b) => b.jenis === jenis) ?? null
      return {
        jenis,
        berkas,
        url: await urlBerkas(BUCKET_BERKAS, berkas?.path_storage ?? null),
      }
    }),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Berkas persyaratan</h1>
        <p className="text-muted-foreground">
          Format JPG, PNG, WEBP, atau PDF. Maksimal 5 MB per berkas.
        </p>
      </div>

      {terkunci ? (
        <Alert>
          <AlertDescription>
            Berkas sudah dikunci karena pendaftaranmu selesai diverifikasi.
            Perubahan hanya bisa lewat dojo.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {kartu.map(({ jenis, berkas, url }) => (
          <Card key={jenis}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base">{LABEL_BERKAS[jenis]}</CardTitle>
                {berkas ? (
                  <Lencana nada={NADA_STATUS_BERKAS[berkas.status]}>
                    {LABEL_STATUS_BERKAS[berkas.status]}
                  </Lencana>
                ) : (
                  <Lencana nada="netral">Belum ada</Lencana>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{PETUNJUK_BERKAS[jenis]}</p>
            </CardHeader>

            <CardContent className="space-y-3">
              <PratinjauBerkas
                url={url}
                path={berkas?.path_storage ?? null}
                alt={LABEL_BERKAS[jenis]}
              />

              {berkas?.status === "ditolak" && berkas.alasan_tolak ? (
                <Alert variant="destructive">
                  <AlertDescription>{berkas.alasan_tolak}</AlertDescription>
                </Alert>
              ) : null}

              <Pengunggah
                pesertaId={pendaftaran.id}
                bucket={BUCKET_BERKAS}
                awalanNama={jenis}
                sudahAda={Boolean(berkas)}
                terkunci={terkunci}
                catat={aksiCatatBerkas.bind(null, pendaftaran.id, jenis)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
