import { redirect } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDaftarDojo, getEventTerbuka, getPendaftaranSaya } from "@/lib/data/peserta"

import { FormPendaftaran } from "./form-pendaftaran"

export const metadata = { title: "Daftar Ujian — SIKAT" }

export default async function HalamanDaftarUjian() {
  const pendaftaran = await getPendaftaranSaya()

  // Satu akun hanya boleh satu tingkat per event; kalau sudah ada, kembali
  // ke halaman status daripada membiarkan form yang pasti gagal.
  if (pendaftaran) redirect("/peserta")

  const [event, dojo] = await Promise.all([getEventTerbuka(), getDaftarDojo()])

  if (!event) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Pendaftaran belum dibuka</CardTitle>
          <CardDescription>
            Belum ada event yang membuka pendaftaran. Tanyakan ke dojomu kapan
            gelombang berikutnya dibuka.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Daftar ujian kenaikan tingkat</h1>
        <p className="text-muted-foreground">
          {event.nama} ·{" "}
          {new Date(event.tanggal).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FormPendaftaran tingkat={event.tingkat} dojo={dojo} />
        </CardContent>
      </Card>
    </div>
  )
}
