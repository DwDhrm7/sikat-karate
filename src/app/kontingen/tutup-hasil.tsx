"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { aksiTutupHasil } from "./aksi"

/**
 * Menutup hasil mengubah status ratusan peserta sekaligus dan mengunci
 * seluruh nilai. Konfirmasinya menyebut angka yang sebenarnya, dan kalau
 * masih ada peserta tanpa nilai, kontingen harus menyatakan paksa secara
 * terpisah — bukan menyetujui satu tombol yang artinya kabur.
 */
export function TutupHasil({
  tingkatId,
  kode,
  siapDinilai,
  sudahDinilai,
}: {
  tingkatId: string
  kode: string
  siapDinilai: number
  sudahDinilai: number
}) {
  const [konfirmasi, setKonfirmasi] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)
  const [hasil, setHasil] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()
  const router = useRouter()

  const belumDinilai = siapDinilai - sudahDinilai

  function jalankan(paksa: boolean) {
    setGalat(null)
    mulai(async () => {
      const res = await aksiTutupHasil(tingkatId, paksa)
      if (res.galat) {
        setGalat(res.galat)
        return
      }
      setHasil(res.sukses ?? "Hasil ditutup.")
      router.refresh()
    })
  }

  if (hasil) {
    return (
      <Alert>
        <AlertDescription>{hasil}</AlertDescription>
      </Alert>
    )
  }

  if (!konfirmasi) {
    return (
      <Button
        variant="outline"
        size="lg"
        disabled={siapDinilai === 0}
        onClick={() => setKonfirmasi(true)}
      >
        Tutup hasil {kode}
      </Button>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border-2 border-merek bg-merek-lembut p-4 text-sm">
      <p className="font-medium">
        Menutup hasil {kode} akan menetapkan lulus atau tidak lulus untuk{" "}
        {siapDinilai} peserta dan mengunci seluruh nilainya.
      </p>

      {belumDinilai > 0 ? (
        <p>
          <strong>{belumDinilai} peserta belum dinilai sama sekali.</strong>{" "}
          Menutup sekarang berarti menandai mereka tidak lulus.
        </p>
      ) : null}

      <p className="text-muted-foreground">
        Setelah ditutup, perubahan nilai hanya bisa lewat kontingen dan selalu
        tercatat di audit log.
      </p>

      {galat ? (
        <Alert variant="destructive">
          <AlertDescription>{galat}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button size="lg" disabled={sibuk} onClick={() => jalankan(false)}>
          {sibuk ? "Menutup…" : "Tutup hasil"}
        </Button>

        {belumDinilai > 0 ? (
          <Button
            size="lg"
            variant="destructive"
            disabled={sibuk}
            onClick={() => jalankan(true)}
          >
            Tutup paksa, tandai {belumDinilai} tidak lulus
          </Button>
        ) : null}

        <Button size="lg" variant="outline" disabled={sibuk} onClick={() => setKonfirmasi(false)}>
          Batal
        </Button>
      </div>
    </div>
  )
}
