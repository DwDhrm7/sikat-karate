"use client"

import { useActionState, useState } from "react"

import { GalatField } from "@/components/galat-field"
import { TombolKirim } from "@/components/tombol-kirim"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { rupiah } from "@/lib/berkas"
import { cn } from "@/lib/utils"

import { aksiDaftarPeserta, type StatusAksi } from "../aksi"

type Tingkat = {
  id: string
  kode: string
  nama: string
  sabuk_asal: string
  sabuk_tujuan: string
  biaya: number
}

type Dojo = { id: string; nama: string; kode: string; kota: string | null }

const AWAL: StatusAksi = {}

const gayaSelect =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

export function FormPendaftaran({
  tingkat,
  dojo,
}: {
  tingkat: Tingkat[]
  dojo: Dojo[]
}) {
  const [status, kirim] = useActionState(aksiDaftarPeserta, AWAL)
  const [tingkatDipilih, setTingkatDipilih] = useState("")

  const terpilih = tingkat.find((t) => t.id === tingkatDipilih)

  return (
    <form action={kirim} className="space-y-5" noValidate>
      {status.galat ? (
        <Alert variant="destructive">
          <AlertDescription>{status.galat}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="tingkat_id">Tingkat yang diambil</Label>
        <select
          id="tingkat_id"
          name="tingkat_id"
          required
          className={gayaSelect}
          value={tingkatDipilih}
          onChange={(e) => setTingkatDipilih(e.target.value)}
        >
          <option value="">— pilih tingkat —</option>
          {tingkat.map((t) => (
            <option key={t.id} value={t.id}>
              {t.kode} · {t.sabuk_asal} → {t.sabuk_tujuan}
            </option>
          ))}
        </select>
        <GalatField pesan={status.galatField?.tingkat_id} />

        {terpilih ? (
          <div
            className={cn(
              "flex items-baseline justify-between rounded-lg border border-merek bg-merek-lembut px-3 py-2",
            )}
          >
            <span className="text-sm">Biaya ujian</span>
            <span className="text-lg font-bold tabular-nums">
              {rupiah(terpilih.biaya)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dojo_id">Dojo</Label>
        <select id="dojo_id" name="dojo_id" required className={gayaSelect}>
          <option value="">— pilih dojo —</option>
          {dojo.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nama}
              {d.kota ? ` — ${d.kota}` : ""}
            </option>
          ))}
        </select>
        <GalatField pesan={status.galatField?.dojo_id} />
        <p className="text-xs text-muted-foreground">
          Dojo inilah yang nanti memverifikasi berkasmu.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama_lengkap">Nama lengkap</Label>
        <Input
          id="nama_lengkap"
          name="nama_lengkap"
          required
          className="h-11"
          autoComplete="name"
        />
        <GalatField pesan={status.galatField?.nama_lengkap} />
        <p className="text-xs text-muted-foreground">
          Tulis sesuai akta. Nama ini yang dicetak di sertifikat.
        </p>
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
        Simpan dan lanjut ke berkas
      </TombolKirim>
    </form>
  )
}
