"use client"

import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { ekstensiDari, periksaBerkas } from "@/lib/berkas"
import { buatKlienBrowser } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Hasil = { galat?: string; sukses?: string }

/**
 * Berkas diunggah langsung dari peramban ke Storage, tidak lewat Server
 * Action: batas badan Server Action hanya 1 MB, sedangkan pas foto dan
 * hasil pindai sering lebih besar. Baris databasenya baru dicatat setelah
 * unggahan berhasil.
 */
export function Pengunggah({
  pesertaId,
  bucket,
  awalanNama,
  sudahAda,
  terkunci = false,
  catat,
}: {
  pesertaId: string
  bucket: string
  awalanNama: string
  sudahAda: boolean
  terkunci?: boolean
  catat: (path: string) => Promise<Hasil>
}) {
  const [galat, setGalat] = useState<string | null>(null)
  const [mengunggah, setMengunggah] = useState(false)
  const [menyegarkan, mulaiSegarkan] = useTransition()
  const input = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const sibuk = mengunggah || menyegarkan

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setGalat(null)

    const keliru = periksaBerkas(file)
    if (keliru) {
      setGalat(keliru)
      e.target.value = ""
      return
    }

    setMengunggah(true)

    const supabase = buatKlienBrowser()
    const path = `${pesertaId}/${awalanNama}-${Date.now()}.${ekstensiDari(file)}`

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (error) {
      setGalat(`Gagal mengunggah: ${error.message}`)
      setMengunggah(false)
      e.target.value = ""
      return
    }

    const hasil = await catat(path)
    setMengunggah(false)
    e.target.value = ""

    if (hasil.galat) {
      setGalat(hasil.galat)
      return
    }

    mulaiSegarkan(() => router.refresh())
  }

  if (terkunci) {
    return (
      <p className="text-sm text-muted-foreground">
        Berkas terkunci karena pendaftaran sudah diverifikasi. Hubungi dojo bila
        perlu diganti.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <label
        className={cn(
          "inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border-2 border-foreground px-4 text-sm font-medium transition-colors",
          "hover:bg-foreground hover:text-background",
          "focus-within:ring-3 focus-within:ring-ring/50",
          sibuk && "pointer-events-none opacity-60",
        )}
      >
        {sibuk ? "Mengunggah…" : sudahAda ? "Ganti berkas" : "Pilih berkas"}
        <input
          ref={input}
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={pilih}
          disabled={sibuk}
        />
      </label>

      {galat ? (
        <Alert variant="destructive">
          <AlertDescription>{galat}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
