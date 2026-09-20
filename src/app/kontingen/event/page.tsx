import { Lencana } from "@/components/lencana"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { rupiah } from "@/lib/berkas"
import { getDaftarEvent } from "@/lib/data/kontingen"

import { FormEvent } from "./form-event"
import { BarisTingkatDapatDiubah, FormTingkat } from "./form-tingkat"
import { TombolStatusEvent } from "./tombol-status"

export const metadata = { title: "Event & Tingkat — SIKAT" }

const LABEL_STATUS_EVENT: Record<string, string> = {
  draft: "Draf",
  pendaftaran_dibuka: "Pendaftaran dibuka",
  pendaftaran_ditutup: "Pendaftaran ditutup",
  berlangsung: "Sedang berlangsung",
  selesai: "Selesai",
}

export default async function HalamanEvent() {
  const daftar = await getDaftarEvent()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Event & tingkat</h1>
        <p className="text-muted-foreground">
          Biaya, nilai bawaan, dan batas lulus diatur per tingkat.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Buat event baru</CardTitle>
        </CardHeader>
        <CardContent>
          <FormEvent />
        </CardContent>
      </Card>

      {daftar.map((event) => (
        <Card key={event.id}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{event.nama}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.tanggal).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {event.lokasi ? ` · ${event.lokasi}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Lencana
                  nada={event.status === "pendaftaran_dibuka" ? "baik" : "netral"}
                >
                  {LABEL_STATUS_EVENT[event.status] ?? event.status}
                </Lencana>
                <TombolStatusEvent eventId={event.id} status={event.status} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <div className="hidden border-b border-border pb-2 text-xs font-medium text-muted-foreground sm:flex sm:gap-4">
                <span className="w-14">Kode</span>
                <span className="flex-1">Nama</span>
                <span className="w-28 text-right">Biaya</span>
                <span className="w-16 text-right">Bawaan</span>
                <span className="w-16 text-right">Lulus</span>
              </div>

              {event.tingkat.map((t) => (
                <BarisTingkatDapatDiubah key={t.id} eventId={event.id} tingkat={t}
                  anak={
                    <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1 text-sm sm:flex-nowrap">
                      <span className="w-14 font-mono font-medium">{t.kode}</span>
                      <span className="flex-1 truncate">
                        {t.nama}
                        {t.wajib_sertifikat_terakhir ? "" : " · tanpa sertifikat"}
                        {t.hasil_ditutup ? " · hasil ditutup" : ""}
                      </span>
                      <span className="w-28 text-right tabular-nums">{rupiah(t.biaya)}</span>
                      <span className="w-16 text-right tabular-nums">{t.nilai_bawaan}</span>
                      <span className="w-16 text-right tabular-nums">{t.batas_lulus}</span>
                    </div>
                  }
                />
              ))}

              {event.tingkat.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  Belum ada tingkat di event ini.
                </p>
              ) : null}
            </div>

            <details className="rounded-lg border border-border bg-muted/40 p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Tambah tingkat ke event ini
              </summary>
              <div className="pt-4">
                <FormTingkat eventId={event.id} />
              </div>
            </details>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
