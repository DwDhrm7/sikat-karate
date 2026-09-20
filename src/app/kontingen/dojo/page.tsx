import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDaftarDojoKontingen } from "@/lib/data/kontingen"

import { FormDojo } from "./form-dojo"

export const metadata = { title: "Dojo — SIKAT" }

export default async function HalamanDojo() {
  const daftar = await getDaftarDojoKontingen()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dojo</h1>
        <p className="text-muted-foreground">
          Dojo tanpa akun tidak bisa memverifikasi pesertanya sendiri.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tambah dojo</CardTitle>
        </CardHeader>
        <CardContent>
          <FormDojo />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{daftar.length} dojo terdaftar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Kode</th>
                  <th className="py-2 pr-4 font-medium">Nama</th>
                  <th className="py-2 pr-4 font-medium">Kota</th>
                  <th className="py-2 pr-4 font-medium">Ketua</th>
                  <th className="py-2 pr-4 text-right font-medium">Peserta</th>
                  <th className="py-2 text-right font-medium">Akun</th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4 font-mono font-medium">{d.kode}</td>
                    <td className="py-2.5 pr-4">{d.nama}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{d.kota ?? "—"}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{d.nama_ketua ?? "—"}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{d.jumlahPeserta}</td>
                    <td
                      className={
                        d.jumlahAkun === 0
                          ? "py-2.5 text-right font-medium text-merek tabular-nums"
                          : "py-2.5 text-right tabular-nums"
                      }
                    >
                      {d.jumlahAkun}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
