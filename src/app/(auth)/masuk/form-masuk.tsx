"use client"

import { useActionState } from "react"

import { GalatField } from "@/components/galat-field"
import { TombolKirim } from "@/components/tombol-kirim"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { aksiMasuk, type StatusForm } from "../aksi"

const AWAL: StatusForm = {}

export function FormMasuk({ lanjut }: { lanjut?: string }) {
  const [status, kirim] = useActionState(aksiMasuk, AWAL)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Masuk</CardTitle>
        <CardDescription>
          Gunakan akun yang terdaftar pada panitia.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={kirim} className="space-y-4" noValidate>
          {lanjut ? <input type="hidden" name="lanjut" value={lanjut} /> : null}

          {status.galat ? (
            <Alert variant="destructive">
              <AlertDescription>{status.galat}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              className="h-11"
              placeholder="nama@contoh.com"
            />
            <GalatField pesan={status.galatField?.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kata_sandi">Kata sandi</Label>
            <Input
              id="kata_sandi"
              name="kata_sandi"
              type="password"
              autoComplete="current-password"
              required
              className="h-11"
            />
            <GalatField pesan={status.galatField?.kata_sandi} />
          </div>

          <TombolKirim sedangProses="Masuk…">Masuk</TombolKirim>
        </form>
      </CardContent>
    </Card>
  )
}
