"use client"

import { useActionState, useState } from "react"

import { GalatField } from "@/components/galat-field"
import { TombolKirim } from "@/components/tombol-kirim"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { aksiBuatAkun, type StatusAksi } from "../aksi"

const AWAL: StatusAksi = {}

const gayaSelect =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

export function FormAkun({ dojo }: { dojo: { id: string; nama: string; kode: string }[] }) {
  const [status, kirim] = useActionState(aksiBuatAkun, AWAL)
  const [peran, setPeran] = useState("")

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
          <Label htmlFor="peran">Peran</Label>
          <select
            id="peran"
            name="peran"
            required
            className={gayaSelect}
            value={peran}
            onChange={(e) => setPeran(e.target.value)}
          >
            <option value="">— pilih peran —</option>
            <option value="dojo">Dojo</option>
            <option value="penguji">Penguji</option>
          </select>
          <GalatField pesan={status.galatField?.peran} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dojo_id">
            Dojo {peran === "penguji" ? <span className="text-muted-foreground">(tidak dipakai)</span> : null}
          </Label>
          <select
            id="dojo_id"
            name="dojo_id"
            className={gayaSelect}
            disabled={peran === "penguji"}
          >
            <option value="">— pilih dojo —</option>
            {dojo.map((d) => (
              <option key={d.id} value={d.id}>
                {d.kode} · {d.nama}
              </option>
            ))}
          </select>
          <GalatField pesan={status.galatField?.dojo_id} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama">Nama</Label>
        <Input id="nama" name="nama" required className="h-11" placeholder="Sensei Nyoman Gunawan" />
        <GalatField pesan={status.galatField?.nama} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required className="h-11" autoComplete="off" />
          <GalatField pesan={status.galatField?.email} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kata_sandi">Kata sandi awal</Label>
          <Input
            id="kata_sandi"
            name="kata_sandi"
            type="text"
            required
            className="h-11"
            autoComplete="off"
          />
          <GalatField pesan={status.galatField?.kata_sandi} />
          <p className="text-xs text-muted-foreground">
            Sengaja terlihat — kamu perlu membacakannya ke pemilik akun.
          </p>
        </div>
      </div>

      <TombolKirim sedangProses="Membuat akun…" className="sm:w-auto sm:px-8">
        Buat akun
      </TombolKirim>
    </form>
  )
}
