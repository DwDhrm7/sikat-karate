import { Card, CardContent } from "@/components/ui/card"
import { getEventTerbuka } from "@/lib/data/peserta"

import { FormDaftarkanPeserta } from "./form-daftarkan"

export const metadata = { title: "Daftarkan Peserta — SIKAT" }

export default async function HalamanDaftarkanPeserta() {
  const event = await getEventTerbuka()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Daftarkan peserta</h1>
        <p className="text-muted-foreground">
          Untuk peserta yang tidak punya akun sendiri. Berkas dan bukti transfer
          diunggah dojo setelah ini.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {event ? (
            <FormDaftarkanPeserta tingkat={event.tingkat} namaEvent={event.nama} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Belum ada event yang membuka pendaftaran.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
