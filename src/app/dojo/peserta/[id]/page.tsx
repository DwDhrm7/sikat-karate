import Link from "next/link"
import { notFound } from "next/navigation"

import { Lencana } from "@/components/lencana"
import { Pengunggah } from "@/components/pengunggah"
import { PratinjauBerkas } from "@/components/pratinjau-berkas"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { aksiCatatBerkas, aksiCatatBukti } from "@/lib/aksi/berkas"
import {
  BUCKET_BERKAS,
  BUCKET_BUKTI,
  LABEL_BERKAS,
  berkasDiperlukan,
  rupiah,
} from "@/lib/berkas"
import { getPesertaById, urlBerkas } from "@/lib/data/peserta"
import {
  LABEL_STATUS_BERKAS,
  LABEL_STATUS_PEMBAYARAN,
  LABEL_STATUS_PESERTA,
  NADA_STATUS_BERKAS,
  NADA_STATUS_PEMBAYARAN,
  NADA_STATUS_PESERTA,
} from "@/lib/status"

import { PanelVerifikasi } from "./panel-verifikasi"
import { TombolKirimDojo } from "./tombol-kirim-dojo"

export const metadata = { title: "Berkas Peserta — SIKAT" }

const BISA_DIUBAH = ["draft", "ditolak", "menunggu_verifikasi"]

export default async function HalamanPesertaDojo({
  params,
}: PageProps<"/dojo/peserta/[id]">) {
  const { id } = await params
  const peserta = await getPesertaById(id)

  if (!peserta) notFound()

  const terkunci = !BISA_DIUBAH.includes(peserta.status)
  const perlu = berkasDiperlukan(peserta.tingkat?.wajib_sertifikat_terakhir ?? true)

  const kartu = await Promise.all(
    perlu.map(async (jenis) => {
      const berkas = peserta.berkas_peserta.find((b) => b.jenis === jenis) ?? null
      return {
        jenis,
        berkas,
        url: await urlBerkas(BUCKET_BERKAS, berkas?.path_storage ?? null),
      }
    }),
  )

  const urlBukti = await urlBerkas(BUCKET_BUKTI, peserta.pembayaran?.path_bukti ?? null)
  const adaBukti = Boolean(peserta.pembayaran?.path_bukti)
  const kurang = perlu.filter((j) => !peserta.berkas_peserta.some((b) => b.jenis === j))
  const siapKirim = kurang.length === 0 && adaBukti
  const bisaKirim = peserta.status === "draft" || peserta.status === "ditolak"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dojo"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            ← Kembali ke beranda dojo
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{peserta.nama_lengkap}</h1>
          <p className="text-muted-foreground">
            {peserta.tingkat?.kode} · {peserta.tingkat?.nama}
            {peserta.no_dada ? ` · ${peserta.no_dada}` : ""}
            {peserta.user_id ? "" : " · didaftarkan dojo"}
          </p>
        </div>
        <Lencana nada={NADA_STATUS_PESERTA[peserta.status]}>
          {LABEL_STATUS_PESERTA[peserta.status]}
        </Lencana>
      </div>

      {peserta.status === "menunggu_verifikasi" ? (
        <PanelVerifikasi
          pesertaId={peserta.id}
          jenisTersedia={perlu.filter((j) =>
            peserta.berkas_peserta.some((b) => b.jenis === j),
          )}
          adaBukti={adaBukti}
        />
      ) : null}

      {peserta.status === "ditolak" && peserta.catatan ? (
        <Alert variant="destructive">
          <AlertDescription>
            Sudah dikembalikan ke peserta: {peserta.catatan}
          </AlertDescription>
        </Alert>
      ) : null}

      {terkunci ? (
        <Alert>
          <AlertDescription>
            Pendaftaran ini sudah lewat tahap verifikasi, berkas tidak bisa
            diganti dari sini.
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
            </CardHeader>
            <CardContent className="space-y-3">
              <PratinjauBerkas
                url={url}
                path={berkas?.path_storage ?? null}
                alt={LABEL_BERKAS[jenis]}
              />
              <Pengunggah
                pesertaId={peserta.id}
                bucket={BUCKET_BERKAS}
                awalanNama={jenis}
                sudahAda={Boolean(berkas)}
                terkunci={terkunci}
                catat={aksiCatatBerkas.bind(null, peserta.id, jenis)}
              />
            </CardContent>
          </Card>
        ))}

        <Card className="border-merek">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-base">
                Bukti transfer · {rupiah(peserta.pembayaran?.jumlah ?? 0)}
              </CardTitle>
              {peserta.pembayaran ? (
                <Lencana nada={NADA_STATUS_PEMBAYARAN[peserta.pembayaran.status]}>
                  {LABEL_STATUS_PEMBAYARAN[peserta.pembayaran.status]}
                </Lencana>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <PratinjauBerkas
              url={urlBukti}
              path={peserta.pembayaran?.path_bukti ?? null}
              alt="Bukti transfer"
            />
            <Pengunggah
              pesertaId={peserta.id}
              bucket={BUCKET_BUKTI}
              awalanNama="bukti-transfer"
              sudahAda={adaBukti}
              terkunci={terkunci}
              catat={aksiCatatBukti.bind(null, peserta.id)}
            />
          </CardContent>
        </Card>
      </div>

      {bisaKirim ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kirim untuk diverifikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {siapKirim ? (
              <p className="text-sm text-muted-foreground">
                Kelengkapan sudah terpenuhi.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Masih kurang:{" "}
                {[
                  ...kurang.map((j) => LABEL_BERKAS[j]),
                  ...(adaBukti ? [] : ["bukti transfer"]),
                ].join(", ")}
                .
              </p>
            )}
            <TombolKirimDojo pesertaId={peserta.id} siap={siapKirim} />
          </CardContent>
        </Card>
      ) : null}

      <Link href="/dojo/peserta/baru" className={buttonVariants({ variant: "outline", size: "lg" })}>
        Daftarkan peserta lain
      </Link>
    </div>
  )
}
