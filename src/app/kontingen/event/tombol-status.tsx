"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { aksiUbahStatusEvent } from "../aksi"

const LANJUT: Record<string, { berikut: string; label: string } | undefined> = {
  draft: { berikut: "pendaftaran_dibuka", label: "Buka pendaftaran" },
  pendaftaran_dibuka: { berikut: "pendaftaran_ditutup", label: "Tutup pendaftaran" },
  pendaftaran_ditutup: { berikut: "berlangsung", label: "Mulai ujian" },
  berlangsung: { berikut: "selesai", label: "Tandai selesai" },
}

export function TombolStatusEvent({
  eventId,
  status,
}: {
  eventId: string
  status: string
}) {
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()
  const router = useRouter()

  const lanjut = LANJUT[status]
  if (!lanjut) return null

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        variant="outline"
        disabled={sibuk}
        onClick={() => {
          setGalat(null)
          mulai(async () => {
            const hasil = await aksiUbahStatusEvent(eventId, lanjut.berikut)
            if (hasil.galat) {
              setGalat(hasil.galat)
              return
            }
            router.refresh()
          })
        }}
      >
        {sibuk ? "Memproses…" : lanjut.label}
      </Button>
      {galat ? (
        <Alert variant="destructive">
          <AlertDescription>{galat}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
