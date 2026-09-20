import Link from "next/link"

import { LangkahAlur } from "@/components/langkah-alur"
import { Lencana } from "@/components/lencana"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LABEL_BERKAS, berkasDiperlukan, rupiah } from "@/lib/berkas"
import { getEventTerbuka, getPendaftaranSaya } from "@/lib/data/peserta"
import {
  LABEL_STATUS_PESERTA,
  NADA_STATUS_PESERTA,
  langkahBerjalan,
} from "@/lib/status"

import { TombolKirimVerifikasi } from "./tombol-kirim-verifikasi"

export const metadata = { title: "Status Pendaftaran — SIKAT" }

function Baris({ label, nilai }: { label: string; nilai: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{nilai}</span>
    </div>
  )
}

export default async function HalamanStatusPeserta() {
  const pendaftaran = await getPendaftaranSaya()

  if (!pendaftaran) {
    const event = await getEventTerbuka()

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Belum ada pendaftaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {event ? (
            <>
              <div className="space-y-1">
                <p className="text-lg font-semibold">{event.nama}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.tanggal).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {event.lokasi ? ` · ${event.lokasi}` : ""}
                </p>
              </div>
              <Link href="/peserta/daftar" className={buttonVariants({ size: "lg" })}>
                Daftar sekarang
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Belum ada event yang membuka pendaftaran. Cek lagi nanti atau
              tanyakan ke dojomu.
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  const tingkat = pendaftaran.tingkat
  const perlu = berkasDiperlukan(tingkat?.wajib_sertifikat_terakhir ?? true)
  const sudahAda = new Set(pendaftaran.berkas_peserta.map((b) => b.jenis))
  const kurangBerkas = perlu.filter((jenis) => !sudahAda.has(jenis))
  const adaBukti = Boolean(pendaftaran.pembayaran?.path_bukti)

  const bisaKirim = pendaftaran.status === "draft" || pendaftaran.status === "ditolak"
  const siapKirim = kurangBerkas.length === 0 && adaBukti

  const berkasDitolak = pendaftaran.berkas_peserta.filter((b) => b.status === "ditolak")
  const bayarDitolak = pendaftaran.pembayaran?.status === "ditolak"

  const hasilTerbit = tingkat?.hasil_ditutup && pendaftaran.penilaian
  const nilai = pendaftaran.penilaian?.nilai
  const hadir = pendaftaran.penilaian?.hadir

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{pendaftaran.nama_lengkap}</h1>
          <p className="text-muted-foreground">
            {tingkat?.kode} · {tingkat?.nama} · {pendaftaran.dojo?.nama}
          </p>
        </div>
        <Lencana nada={NADA_STATUS_PESERTA[pendaftaran.status]}>
          {LABEL_STATUS_PESERTA[pendaftaran.status]}
        </Lencana>
      </div>

      {pendaftaran.status === "ditolak" ? (
        <Alert variant="destructive">
          <AlertTitle>Perlu diperbaiki</AlertTitle>
          <AlertDescription className="space-y-2">
            {pendaftaran.catatan ? <p>{pendaftaran.catatan}</p> : null}
            {berkasDitolak.length > 0 ? (
              <ul className="list-inside list-disc">
                {berkasDitolak.map((b) => (
                  <li key={b.id}>
                    {LABEL_BERKAS[b.jenis]}
                    {b.alasan_tolak ? ` — ${b.alasan_tolak}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
            {bayarDitolak ? (
              <p>
                Bukti pembayaran ditolak
                {pendaftaran.pembayaran?.alasan_tolak
                  ? ` — ${pendaftaran.pembayaran.alasan_tolak}`
                  : ""}
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {pendaftaran.no_dada ? (
        <Card className="border-merek">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
            <div>
              <p className="text-sm text-muted-foreground">Nomor dada</p>
              <p className="font-mono text-5xl font-bold tracking-tight text-merek">
                {pendaftaran.no_dada}
              </p>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Bawa kartu peserta pada hari ujian. Nomor ini yang dipakai penguji
              untuk menemukanmu di lapangan.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {hasilTerbit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hasil ujian</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nilai akhir</p>
              <p className="text-5xl font-bold tabular-nums">
                {hadir === false ? "—" : nilai}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hadir === false
                  ? "Tercatat tidak hadir"
                  : `Batas lulus ${tingkat?.batas_lulus}`}
              </p>
            </div>
            <Lencana nada={NADA_STATUS_PESERTA[pendaftaran.status]} className="text-sm">
              {LABEL_STATUS_PESERTA[pendaftaran.status]}
            </Lencana>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Perjalanan pendaftaran
        </h2>
        <LangkahAlur berjalan={langkahBerjalan(pendaftaran.status)} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rincian</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Baris label="Event" nilai={pendaftaran.event_ujian?.nama} />
            <Baris
              label="Tanggal ujian"
              nilai={
                pendaftaran.event_ujian?.tanggal
                  ? new Date(pendaftaran.event_ujian.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"
              }
            />
            <Baris label="Lokasi" nilai={pendaftaran.event_ujian?.lokasi ?? "—"} />
            <Baris
              label="Kenaikan"
              nilai={`${tingkat?.sabuk_asal} → ${tingkat?.sabuk_tujuan}`}
            />
            <Baris label="Dojo" nilai={pendaftaran.dojo?.nama} />
            <Baris
              label="Biaya"
              nilai={rupiah(pendaftaran.pembayaran?.jumlah ?? tingkat?.biaya ?? 0)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kelengkapan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div>
              {perlu.map((jenis) => {
                const berkas = pendaftaran.berkas_peserta.find((b) => b.jenis === jenis)
                return (
                  <Baris
                    key={jenis}
                    label={LABEL_BERKAS[jenis]}
                    nilai={
                      berkas ? (
                        berkas.status === "ditolak" ? (
                          <span className="text-merek">ditolak</span>
                        ) : berkas.status === "diterima" ? (
                          "diterima"
                        ) : (
                          "terunggah"
                        )
                      ) : (
                        <span className="text-muted-foreground">belum ada</span>
                      )
                    }
                  />
                )
              })}
              <Baris
                label="Bukti transfer"
                nilai={
                  adaBukti ? (
                    pendaftaran.pembayaran?.status === "lunas" ? (
                      "lunas"
                    ) : pendaftaran.pembayaran?.status === "ditolak" ? (
                      <span className="text-merek">ditolak</span>
                    ) : (
                      "terunggah"
                    )
                  ) : (
                    <span className="text-muted-foreground">belum ada</span>
                  )
                }
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/peserta/berkas" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Kelola berkas
              </Link>
              <Link
                href="/peserta/pembayaran"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Pembayaran
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {bisaKirim ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kirim untuk diverifikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {siapKirim ? (
              <p className="text-sm text-muted-foreground">
                Semua persyaratan sudah lengkap. Setelah dikirim, berkas terkunci
                sampai dojo selesai memeriksa.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Masih kurang:{" "}
                {[
                  ...kurangBerkas.map((jenis) => LABEL_BERKAS[jenis]),
                  ...(adaBukti ? [] : ["bukti transfer"]),
                ].join(", ")}
                .
              </p>
            )}
            <TombolKirimVerifikasi pesertaId={pendaftaran.id} siap={siapKirim} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
