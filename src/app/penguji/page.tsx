import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { wajibPeran } from "@/lib/auth/sesi"
import { getPesertaUntukDinilai, getTugasSaya } from "@/lib/data/penguji"
import { cn } from "@/lib/utils"

import { TabelPenilaian } from "./tabel-penilaian"

export const metadata = { title: "Penilaian — SIKAT" }

function satu(nilai: string | string[] | undefined): string | undefined {
  return Array.isArray(nilai) ? nilai[0] : nilai
}

function labelRentang(rentang: { awal: number | null; akhir: number | null }[], kode: string) {
  return rentang
    .map((r) =>
      r.awal === null
        ? "seluruh tingkat"
        : `${kode}-${String(r.awal).padStart(3, "0")} s/d ${kode}-${String(r.akhir).padStart(3, "0")}`,
    )
    .join(" · ")
}

export default async function HalamanPenilaian({ searchParams }: PageProps<"/penguji">) {
  const pengguna = await wajibPeran("penguji")
  const tugas = await getTugasSaya()

  if (tugas.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-lg font-medium">Belum ada penugasan</p>
          <p className="mt-1 text-muted-foreground">
            Kontingen belum menugaskanmu ke tingkat mana pun. Hubungi panitia.
          </p>
        </CardContent>
      </Card>
    )
  }

  const diminta = satu((await searchParams).tingkat)
  const aktif = tugas.find((t) => t.tingkatId === diminta) ?? tugas[0]
  const peserta = await getPesertaUntukDinilai(aktif.tingkatId)

  return (
    <div className="space-y-4">
      {tugas.length > 1 ? (
        <nav className="flex flex-wrap gap-2" aria-label="Pilih tingkat">
          {tugas.map((t) => (
            <Link
              key={t.tingkatId}
              href={`/penguji?tingkat=${t.tingkatId}`}
              aria-current={t.tingkatId === aktif.tingkatId ? "page" : undefined}
              className={cn(
                "inline-flex h-12 items-center rounded-lg border-2 px-4 font-medium",
                t.tingkatId === aktif.tingkatId
                  ? "border-merek bg-merek-lembut"
                  : "border-border",
              )}
            >
              <span className="font-mono">{t.kode}</span>
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold">
          <span className="font-mono">{aktif.kode}</span> · {aktif.nama}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tanggung jawabmu: {labelRentang(aktif.rentang, aktif.kode)}
        </p>
      </div>

      {aktif.hasilDitutup ? (
        <Alert variant="destructive">
          <AlertTitle>Hasil sudah ditutup</AlertTitle>
          <AlertDescription>
            Nilai tingkat ini terkunci. Perubahan hanya bisa lewat kontingen dan
            akan tercatat di audit log.
          </AlertDescription>
        </Alert>
      ) : null}

      {peserta.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-lg font-medium">Belum ada peserta di rentangmu</p>
            <p className="mt-1 text-muted-foreground">
              Nomor dada terbit setelah dojo mengunci batchnya.
            </p>
          </CardContent>
        </Card>
      ) : (
        <TabelPenilaian
          peserta={peserta}
          nilaiBawaan={aktif.nilaiBawaan}
          tingkatId={aktif.tingkatId}
          pengujiId={pengguna.id}
          terkunci={aktif.hasilDitutup}
        />
      )}
    </div>
  )
}
