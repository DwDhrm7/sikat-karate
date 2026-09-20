"use client"

import Link from "next/link"
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

import { aksiDaftar, type StatusForm } from "../aksi"

const AWAL: StatusForm = {}

export function FormDaftar() {
  const [status, kirim] = useActionState(aksiDaftar, AWAL)

  if (status.sukses) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Akun dibuat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>{status.sukses}</AlertDescription>
          </Alert>
          <Link
            href="/masuk"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-base font-medium text-primary-foreground"
          >
            Ke halaman masuk
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Daftar akun peserta</CardTitle>
        <CardDescription>
          Akun dojo dan penguji dibuatkan kontingen, bukan lewat halaman ini.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={kirim} className="space-y-4" noValidate>
          {status.galat ? (
            <Alert variant="destructive">
              <AlertDescription>{status.galat}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="nama">Nama lengkap</Label>
            <Input id="nama" name="nama" required className="h-11" autoComplete="name" />
            <GalatField pesan={status.galatField?.nama} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              className="h-11"
              placeholder="nama@contoh.com"
            />
            <GalatField pesan={status.galatField?.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="no_hp">
              Nomor HP <span className="text-muted-foreground">(opsional)</span>
            </Label>
            <Input
              id="no_hp"
              name="no_hp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="h-11"
              placeholder="0812xxxxxxx"
            />
            <GalatField pesan={status.galatField?.no_hp} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kata_sandi">Kata sandi</Label>
            <Input
              id="kata_sandi"
              name="kata_sandi"
              type="password"
              autoComplete="new-password"
              required
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
            <GalatField pesan={status.galatField?.kata_sandi} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="konfirmasi_sandi">Ulangi kata sandi</Label>
            <Input
              id="konfirmasi_sandi"
              name="konfirmasi_sandi"
              type="password"
              autoComplete="new-password"
              required
              className="h-11"
            />
            <GalatField pesan={status.galatField?.konfirmasi_sandi} />
          </div>

          <TombolKirim sedangProses="Mendaftar…">Daftar</TombolKirim>
        </form>
      </CardContent>
    </Card>
  )
}
