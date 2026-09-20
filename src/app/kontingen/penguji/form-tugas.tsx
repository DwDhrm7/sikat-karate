"use client"

import { useActionState } from "react"

import { GalatField } from "@/components/galat-field"
import { TombolKirim } from "@/components/tombol-kirim"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { aksiTugaskanPenguji, type StatusAksi } from "../aksi"

const AWAL: StatusAksi = {}

const gayaSelect =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

export function FormTugas({
  tingkat,
  penguji,
}: {
  tingkat: { id: string; kode: string; nama: string }[]
  penguji: { id: string; nama: string }[]
}) {
  const [status, kirim] = useActionState(aksiTugaskanPenguji, AWAL)

  return (
    <form action={kirim} className="space-y-4" noValidate>
      {status.galat ? (
        <Alert variant="destructive">
          <AlertDescription>{status.galat}</AlertDescription>
        </Alert>
      ) : null}
      {status.sukses ? (
        <Alert>
          <AlertDescription>{status.sukses}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tingkat_id">Tingkat</Label>
          <select id="tingkat_id" name="tingkat_id" required className={gayaSelect}>
            <option value="">— pilih tingkat —</option>
            {tingkat.map((t) => (
              <option key={t.id} value={t.id}>
                {t.kode} · {t.nama}
              </option>
            ))}
          </select>
          <GalatField pesan={status.galatField?.tingkat_id} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="penguji_user_id">Penguji</Label>
          <select id="penguji_user_id" name="penguji_user_id" required className={gayaSelect}>
            <option value="">— pilih penguji —</option>
            {penguji.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
          <GalatField pesan={status.galatField?.penguji_user_id} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="no_awal">Nomor awal</Label>
          <Input id="no_awal" name="no_awal" type="number" min={1} className="h-11" placeholder="1" />
          <GalatField pesan={status.galatField?.no_awal} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="no_akhir">Nomor akhir</Label>
          <Input id="no_akhir" name="no_akhir" type="number" min={1} className="h-11" placeholder="110" />
          <GalatField pesan={status.galatField?.no_akhir} />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Kosongkan kedua nomor kalau penguji ini memegang seluruh tingkat. Angka
        yang dimaksud adalah bagian angka nomor dada — <code>PK-014</code>{" "}
        berarti 14.
      </p>

      <TombolKirim sedangProses="Menyimpan…" className="sm:w-auto sm:px-8">
        Tugaskan
      </TombolKirim>
    </form>
  )
}
