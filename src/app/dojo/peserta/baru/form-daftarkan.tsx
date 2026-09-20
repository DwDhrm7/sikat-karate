"use client"

import { useActionState, useState } from "react"

import { GalatField } from "@/components/galat-field"
import { TombolKirim } from "@/components/tombol-kirim"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { rupiah } from "@/lib/berkas"

import { aksiDaftarkanPeserta, type StatusAksi } from "../../aksi"

type Tingkat = {
  id: string
  kode: string
  sabuk_asal: string
  sabuk_tujuan: string
  biaya: number
}

const AWAL: StatusAksi = {}

const gayaSelect =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

export function FormDaftarkanPeserta({
  tingkat,
  namaEvent,
}: {
  tingkat: Tingkat[]
  namaEvent: string
}) {
  const [status, kirim] = useActionState(aksiDaftarkanPeserta, AWAL)
  const [dipilih, setDipilih] = useState("")

  const terpilih = tingkat.find((t) => t.id === dipilih)

  return (
    <form action={kirim} className="space-y-5" noValidate>
      {status.galat ? (
        <Alert variant="destructive">
          <AlertDescription>{status.galat}</AlertDescription>
        </Alert>
      ) : null}

      <p className="text-sm text-muted-foreground">Event: {namaEvent}</p>

      <div className="space-y-2">
        <Label htmlFor="tingkat_id">Tingkat</Label>
        <select
          id="tingkat_id"
          name="tingkat_id"
          required
          className={gayaSelect}
          value={dipilih}
          onChange={(e) => setDipilih(e.target.value)}
        >
          <option value="">— pilih tingkat —</option>
          {tingkat.map((t) => (
            <option key={t.id} value={t.id}>
              {t.kode} · {t.sabuk_asal} → {t.sabuk_tujuan} · {rupiah(t.biaya)}
            </option>
          ))}
        </select>
        <GalatField pesan={status.galatField?.tingkat_id} />
        {terpilih ? (
          <p className="text-sm text-muted-foreground">
            Tagihan yang terbit: <strong>{rupiah(terpilih.biaya)}</strong>
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama_lengkap">Nama lengkap peserta</Label>
        <Input id="nama_lengkap" name="nama_lengkap" required className="h-11" />
        <GalatField pesan={status.galatField?.nama_lengkap} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tgl_lahir">Tanggal lahir</Label>
          <Input id="tgl_lahir" name="tgl_lahir" type="date" required className="h-11" />
          <GalatField pesan={status.galatField?.tgl_lahir} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jenis_kelamin">Jenis kelamin</Label>
          <select id="jenis_kelamin" name="jenis_kelamin" required className={gayaSelect}>
            <option value="">— pilih —</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          <GalatField pesan={status.galatField?.jenis_kelamin} />
        </div>
      </div>

      <TombolKirim sedangProses="Menyimpan…" className="sm:w-auto sm:px-8">
        Simpan peserta
      </TombolKirim>
    </form>
  )
}
