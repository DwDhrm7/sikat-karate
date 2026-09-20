"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { aksiKirimVerifikasi } from "@/lib/aksi/berkas"

export function TombolKirimDojo({
  pesertaId,
  siap,
}: {
  pesertaId: string
  siap: boolean
}) {
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()
  const router = useRouter()

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        className="h-12 w-full text-base sm:w-auto sm:px-8"
        disabled={!siap || sibuk}
        onClick={() => {
          setGalat(null)
          mulai(async () => {
            const hasil = await aksiKirimVerifikasi(pesertaId)
            if (hasil.galat) {
              setGalat(hasil.galat)
              return
            }
            router.refresh()
          })
        }}
      >
        {sibuk ? "Mengirim…" : "Kirim untuk verifikasi"}
      </Button>

      {galat ? (
        <Alert variant="destructive">
          <AlertDescription>{galat}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
