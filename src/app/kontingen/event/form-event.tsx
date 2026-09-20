"use client"

import { useActionState } from "react"

import { GalatField } from "@/components/galat-field"
import { TombolKirim } from "@/components/tombol-kirim"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { aksiBuatEvent, type StatusAksi } from "../aksi"

const AWAL: StatusAksi = {}

export function FormEvent() {
  const [status, kirim] = useActionState(aksiBuatEvent, AWAL)

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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nama">Nama event</Label>
          <Input id="nama" name="nama" required className="h-11" placeholder="Ujian Kenaikan Tingkat Gelombang II 2027" />
          <GalatField pesan={status.galatField?.nama} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tanggal">Tanggal</Label>
          <Input id="tanggal" name="tanggal" type="date" required className="h-11" />
          <GalatField pesan={status.galatField?.tanggal} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lokasi">Lokasi</Label>
        <Input id="lokasi" name="lokasi" className="h-11" placeholder="GOR Lila Bhuana, Denpasar" />
        <GalatField pesan={status.galatField?.lokasi} />
      </div>

      <TombolKirim sedangProses="Menyimpan…" className="sm:w-auto sm:px-8">
        Buat event
      </TombolKirim>
    </form>
  )
}
