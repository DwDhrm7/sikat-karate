import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getDaftarPenguji,
  getPenugasan,
  getProgresTingkat,
} from "@/lib/data/kontingen"

import { FormTugas } from "./form-tugas"
import { TombolHapusTugas } from "./tombol-hapus"

export const metadata = { title: "Penugasan Penguji — SIKAT" }

export default async function HalamanPenguji() {
  const [penugasan, penguji, progres] = await Promise.all([
    getPenugasan(),
    getDaftarPenguji(),
    getProgresTingkat(),
  ])

  const bermasalah = progres.filter((t) => t.cakupan.length > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Penugasan penguji</h1>
        <p className="text-muted-foreground">
          Beban dibagi lewat rentang nomor dada. Satu peserta dinilai satu
          penguji.
        </p>
      </div>

      {bermasalah.length > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Rentang belum beres</AlertTitle>
          <AlertDescription>
            <ul className="list-inside list-disc">
              {bermasalah.flatMap((t) =>
                t.cakupan.map((c, i) => (
                  <li key={`${t.tingkatId}-${i}`}>
                    <span className="font-mono">{t.kode}</span> nomor {c.dari}–
                    {c.sampai}{" "}
                    {c.jenis === "kosong"
                      ? "belum dipegang penguji mana pun"
                      : "dipegang lebih dari satu penguji"}
                  </li>
                )),
              )}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tugaskan penguji</CardTitle>
        </CardHeader>
        <CardContent>
          {penguji.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada akun penguji. Buat dulu di halaman Akun.
            </p>
          ) : (
            <FormTugas
              tingkat={progres.map((t) => ({ id: t.tingkatId, kode: t.kode, nama: t.nama }))}
              penguji={penguji}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{penugasan.length} penugasan aktif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Tingkat</th>
                  <th className="py-2 pr-4 font-medium">Penguji</th>
                  <th className="py-2 pr-4 font-medium">Rentang</th>
                  <th className="py-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {penugasan.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4 font-mono font-medium">
                      {t.tingkat?.kode}
                    </td>
                    <td className="py-2.5 pr-4">{t.namaPenguji}</td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {t.no_awal === null
                        ? "seluruh tingkat"
                        : `${t.tingkat?.kode}-${String(t.no_awal).padStart(3, "0")} s/d ${t.tingkat?.kode}-${String(t.no_akhir).padStart(3, "0")}`}
                    </td>
                    <td className="py-2.5 text-right">
                      <TombolHapusTugas tugasId={t.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {penugasan.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada penugasan.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
