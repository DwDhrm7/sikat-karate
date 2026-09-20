"use client"

import { useActionState, useState } from "react"

import { GalatField } from "@/components/galat-field"
import { TombolKirim } from "@/components/tombol-kirim"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { aksiSimpanTingkat, type StatusAksi } from "../aksi"

type Tingkat = {
  id: string
  kode: string
  nama: string
  sabuk_asal: string
  sabuk_tujuan: string
  biaya: number
  nilai_bawaan: number
  batas_lulus: number
  urutan: number
  wajib_sertifikat_terakhir: boolean
}

const AWAL: StatusAksi = {}

export function FormTingkat({
  eventId,
  tingkat,
  onSelesai,
}: {
  eventId: string
  tingkat?: Tingkat
  onSelesai?: () => void
}) {
  const [status, kirim] = useActionState(aksiSimpanTingkat, AWAL)
  const ubah = Boolean(tingkat)

  return (
    <form action={kirim} className="space-y-4" noValidate>
      <input type="hidden" name="event_id" value={eventId} />
      {tingkat ? <input type="hidden" name="tingkat_id" value={tingkat.id} /> : null}

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
          <Label htmlFor={`kode-${tingkat?.id ?? "baru"}`}>Kode</Label>
          <Input
            id={`kode-${tingkat?.id ?? "baru"}`}
            name="kode"
            required
            maxLength={4}
            defaultValue={tingkat?.kode}
            readOnly={ubah}
            className="h-11 font-mono uppercase read-only:bg-muted"
            placeholder="PK"
          />
          <GalatField pesan={status.galatField?.kode} />
          {ubah ? (
            <p className="text-xs text-muted-foreground">
              Kode tidak bisa diubah — nomor dada yang sudah terbit memakainya.
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`nama-${tingkat?.id ?? "baru"}`}>Nama tingkat</Label>
          <Input
            id={`nama-${tingkat?.id ?? "baru"}`}
            name="nama"
            required
            defaultValue={tingkat?.nama}
            className="h-11"
            placeholder="Putih ke Kuning"
          />
          <GalatField pesan={status.galatField?.nama} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`urutan-${tingkat?.id ?? "baru"}`}>Urutan</Label>
          <Input
            id={`urutan-${tingkat?.id ?? "baru"}`}
            name="urutan"
            type="number"
            min={1}
            max={99}
            required
            defaultValue={tingkat?.urutan ?? 1}
            className="h-11"
          />
          <GalatField pesan={status.galatField?.urutan} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`asal-${tingkat?.id ?? "baru"}`}>Sabuk asal</Label>
          <Input
            id={`asal-${tingkat?.id ?? "baru"}`}
            name="sabuk_asal"
            required
            defaultValue={tingkat?.sabuk_asal}
            className="h-11"
            placeholder="Putih"
          />
          <GalatField pesan={status.galatField?.sabuk_asal} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`tujuan-${tingkat?.id ?? "baru"}`}>Sabuk tujuan</Label>
          <Input
            id={`tujuan-${tingkat?.id ?? "baru"}`}
            name="sabuk_tujuan"
            required
            defaultValue={tingkat?.sabuk_tujuan}
            className="h-11"
            placeholder="Kuning"
          />
          <GalatField pesan={status.galatField?.sabuk_tujuan} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`biaya-${tingkat?.id ?? "baru"}`}>Biaya (Rp)</Label>
          <Input
            id={`biaya-${tingkat?.id ?? "baru"}`}
            name="biaya"
            type="number"
            min={0}
            step={1000}
            required
            defaultValue={tingkat?.biaya ?? 0}
            className="h-11"
          />
          <GalatField pesan={status.galatField?.biaya} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`bawaan-${tingkat?.id ?? "baru"}`}>Nilai bawaan</Label>
          <Input
            id={`bawaan-${tingkat?.id ?? "baru"}`}
            name="nilai_bawaan"
            type="number"
            min={0}
            max={100}
            required
            defaultValue={tingkat?.nilai_bawaan ?? 80}
            className="h-11"
          />
          <GalatField pesan={status.galatField?.nilai_bawaan} />
          <p className="text-xs text-muted-foreground">
            Nilai yang sudah terisi di tabel penguji.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`batas-${tingkat?.id ?? "baru"}`}>Batas lulus</Label>
          <Input
            id={`batas-${tingkat?.id ?? "baru"}`}
            name="batas_lulus"
            type="number"
            min={0}
            max={100}
            required
            defaultValue={tingkat?.batas_lulus ?? 60}
            className="h-11"
          />
          <GalatField pesan={status.galatField?.batas_lulus} />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          name="wajib_sertifikat_terakhir"
          defaultChecked={tingkat?.wajib_sertifikat_terakhir ?? true}
          className="size-5 accent-[var(--merek)]"
        />
        Wajib melampirkan sertifikat tingkat terakhir
      </label>

      <div className="flex flex-wrap gap-2">
        <TombolKirim sedangProses="Menyimpan…" className="sm:w-auto sm:px-8">
          {ubah ? "Simpan perubahan" : "Tambah tingkat"}
        </TombolKirim>
        {onSelesai ? (
          <Button type="button" variant="outline" size="lg" onClick={onSelesai}>
            Tutup
          </Button>
        ) : null}
      </div>
    </form>
  )
}

export function BarisTingkatDapatDiubah({
  eventId,
  tingkat,
  anak,
}: {
  eventId: string
  tingkat: Tingkat
  anak: React.ReactNode
}) {
  const [buka, setBuka] = useState(false)

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        {anak}
        <Button variant="outline" size="sm" onClick={() => setBuka((b) => !b)}>
          {buka ? "Tutup" : "Ubah"}
        </Button>
      </div>
      {buka ? (
        <div className="mb-4 rounded-lg border border-border bg-muted/40 p-4">
          <FormTingkat
            eventId={eventId}
            tingkat={tingkat}
            onSelesai={() => setBuka(false)}
          />
        </div>
      ) : null}
    </div>
  )
}
