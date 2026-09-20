"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { aksiKunciBatch } from "./aksi"

/**
 * Penguncian batch tidak bisa dibatalkan dan nomor yang terbit tidak pernah
 * didaur ulang, jadi konfirmasinya menyebutkan angka yang sebenarnya —
 * berapa yang dapat nomor, dan berapa yang akan tertinggal.
 */
export function KunciBatch({
  eventId,
  tingkatId,
  kode,
  siapDikunci,
  menggantung,
}: {
  eventId: string
  tingkatId: string
  kode: string
  siapDikunci: number
  menggantung: number
}) {
  const [konfirmasi, setKonfirmasi] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)
  const [hasil, setHasil] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()
  const router = useRouter()

  if (hasil) {
    return (
      <Alert>
        <AlertDescription>{hasil}</AlertDescription>
      </Alert>
    )
  }

  if (!konfirmasi) {
    return (
      <div className="space-y-2">
        <Button
          size="lg"
          disabled={siapDikunci === 0}
          onClick={() => setKonfirmasi(true)}
        >
          Kunci batch {kode}
        </Button>
        {siapDikunci === 0 ? (
          <p className="text-xs text-muted-foreground">
            Belum ada peserta terverifikasi yang menunggu nomor.
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border-2 border-merek bg-merek-lembut p-4">
      <div className="space-y-1 text-sm">
        <p className="font-medium">
          {siapDikunci} peserta akan menerima nomor dada tingkat {kode}.
        </p>
        {menggantung > 0 ? (
          <p>
            <strong>{menggantung} peserta lain belum selesai</strong> dan tidak
            akan kebagian nomor pada penguncian ini.
          </p>
        ) : null}
        <p className="text-muted-foreground">
          Nomor yang sudah terbit tidak pernah dipakai ulang. Kalau ada peserta
          menyusul, batch bisa dikunci lagi dan mereka mendapat blok baru di
          ekor.
        </p>
      </div>

      {galat ? (
        <Alert variant="destructive">
          <AlertDescription>{galat}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          disabled={sibuk}
          onClick={() => {
            setGalat(null)
            mulai(async () => {
              const res = await aksiKunciBatch(eventId, tingkatId)
              if (res.galat) {
                setGalat(res.galat)
                return
              }
              setHasil(
                `${res.sukses} Blok nomor ${kode}-${String(res.noAwal).padStart(3, "0")} sampai ${kode}-${String(res.noAkhir).padStart(3, "0")}.`,
              )
              router.refresh()
            })
          }}
        >
          {sibuk ? "Menerbitkan nomor…" : "Ya, kunci sekarang"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={sibuk}
          onClick={() => setKonfirmasi(false)}
        >
          Batal
        </Button>
      </div>
    </div>
  )
}
