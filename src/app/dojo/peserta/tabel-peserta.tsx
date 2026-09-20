"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"

import { Lencana } from "@/components/lencana"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { berkasDiperlukan } from "@/lib/berkas"
import type { BarisPeserta } from "@/lib/data/dojo"
import { LABEL_STATUS_PESERTA, NADA_STATUS_PESERTA } from "@/lib/status"
import { cn } from "@/lib/utils"

import { aksiVerifikasiMassal } from "../aksi"

const gayaCentang =
  "size-5 cursor-pointer accent-[var(--merek)] disabled:cursor-not-allowed disabled:opacity-30"

export function TabelPeserta({ baris }: { baris: BarisPeserta[] }) {
  const [dipilih, setDipilih] = useState<Set<string>>(new Set())
  const [pesan, setPesan] = useState<{ galat?: string; sukses?: string }>({})
  const [sibuk, mulai] = useTransition()
  const router = useRouter()

  // Hanya yang sedang menunggu verifikasi yang masuk akal dicentang.
  const bisaDicentang = useMemo(
    () => baris.filter((b) => b.status === "menunggu_verifikasi"),
    [baris],
  )

  const semuaTercentang =
    bisaDicentang.length > 0 && dipilih.size === bisaDicentang.length

  function ubah(id: string, nyala: boolean) {
    setDipilih((lama) => {
      const baru = new Set(lama)
      if (nyala) baru.add(id)
      else baru.delete(id)
      return baru
    })
  }

  function setujui() {
    setPesan({})
    mulai(async () => {
      const hasil = await aksiVerifikasiMassal([...dipilih])
      setPesan({ galat: hasil.galat, sukses: hasil.sukses })
      if (!hasil.galat) {
        setDipilih(new Set())
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {pesan.galat ? (
        <Alert variant="destructive">
          <AlertDescription>{pesan.galat}</AlertDescription>
        </Alert>
      ) : null}
      {pesan.sukses ? (
        <Alert>
          <AlertDescription>{pesan.sukses}</AlertDescription>
        </Alert>
      ) : null}

      {dipilih.size > 0 ? (
        <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-merek bg-background p-3 shadow-sm">
          <span className="text-sm font-medium">
            {dipilih.size} peserta dicentang
          </span>
          <div className="flex gap-2">
            <Button size="lg" disabled={sibuk} onClick={setujui}>
              {sibuk ? "Memproses…" : `Setujui ${dipilih.size} peserta`}
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={sibuk}
              onClick={() => setDipilih(new Set())}
            >
              Bersihkan
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="w-12 px-3 py-3">
                <input
                  type="checkbox"
                  className={gayaCentang}
                  aria-label="Centang semua yang menunggu verifikasi"
                  checked={semuaTercentang}
                  disabled={bisaDicentang.length === 0}
                  onChange={(e) =>
                    setDipilih(
                      e.target.checked ? new Set(bisaDicentang.map((b) => b.id)) : new Set(),
                    )
                  }
                />
              </th>
              <th className="px-3 py-3 font-medium">Nomor</th>
              <th className="px-3 py-3 font-medium">Nama</th>
              <th className="px-3 py-3 font-medium">Tingkat</th>
              <th className="px-3 py-3 font-medium">Berkas</th>
              <th className="px-3 py-3 font-medium">Bayar</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>

          <tbody>
            {baris.map((b) => {
              const perlu = berkasDiperlukan(b.tingkat?.wajib_sertifikat_terakhir ?? true)
              const ada = b.berkas_peserta.length
              const lengkap = perlu.every((j) =>
                b.berkas_peserta.some((x) => x.jenis === j),
              )
              const adaBukti = Boolean(b.pembayaran?.path_bukti)
              const dapatDicentang = b.status === "menunggu_verifikasi"

              return (
                <tr
                  key={b.id}
                  className={cn(
                    "border-b border-border last:border-0",
                    dipilih.has(b.id) && "bg-merek-lembut",
                  )}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      className={gayaCentang}
                      aria-label={`Centang ${b.nama_lengkap}`}
                      checked={dipilih.has(b.id)}
                      disabled={!dapatDicentang}
                      onChange={(e) => ubah(b.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-3 py-3 font-mono whitespace-nowrap">
                    {b.no_dada ?? "—"}
                  </td>
                  <td className="px-3 py-3 font-medium">{b.nama_lengkap}</td>
                  <td className="px-3 py-3 font-mono">{b.tingkat?.kode}</td>
                  <td
                    className={cn(
                      "px-3 py-3 tabular-nums",
                      !lengkap && "font-medium text-merek",
                    )}
                  >
                    {ada}/{perlu.length}
                  </td>
                  <td className={cn("px-3 py-3", !adaBukti && "text-merek")}>
                    {adaBukti ? (b.pembayaran?.status === "lunas" ? "lunas" : "ada") : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <Lencana nada={NADA_STATUS_PESERTA[b.status]}>
                      {LABEL_STATUS_PESERTA[b.status]}
                    </Lencana>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/dojo/peserta/${b.id}`}
                      className="font-medium whitespace-nowrap underline underline-offset-4"
                    >
                      Periksa
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {baris.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">
            Tidak ada peserta yang cocok dengan saringan ini.
          </p>
        ) : null}
      </div>
    </div>
  )
}
