"use client"

import { useActionState } from "react"

import { GalatField } from "@/components/galat-field"
import { TombolKirim } from "@/components/tombol-kirim"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { aksiBuatDojo, type StatusAksi } from "../aksi"

const AWAL: StatusAksi = {}

export function FormDojo() {
  const [status, kirim] = useActionState(aksiBuatDojo, AWAL)

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

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="kode">Kode</Label>
          <Input id="kode" name="kode" required maxLength={5} className="h-11 font-mono uppercase" placeholder="BKY" />
          <GalatField pesan={status.galatField?.kode} />
        </div>
        <div className="space-y-2 sm:col-span-3">
          <Label htmlFor="nama">Nama dojo</Label>
          <Input id="nama" name="nama" required className="h-11" placeholder="Dojo Bina Karya" />
          <GalatField pesan={status.galatField?.nama} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kota">Kota</Label>
          <Input id="kota" name="kota" className="h-11" placeholder="Denpasar" />
          <GalatField pesan={status.galatField?.kota} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nama_ketua">Nama ketua</Label>
          <Input id="nama_ketua" name="nama_ketua" className="h-11" placeholder="Sensei Wayan Sudira" />
          <GalatField pesan={status.galatField?.nama_ketua} />
        </div>
      </div>

      <TombolKirim sedangProses="Menyimpan…" className="sm:w-auto sm:px-8">
        Tambah dojo
      </TombolKirim>
    </form>
  )
}
