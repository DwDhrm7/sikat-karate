import { Lencana } from "@/components/lencana"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LABEL_PERAN } from "@/lib/auth/sesi"
import { getDaftarAkun, getDaftarDojoKontingen } from "@/lib/data/kontingen"

import { FormAkun } from "./form-akun"

export const metadata = { title: "Akun — SIKAT" }

export default async function HalamanAkun() {
  const [akun, dojo] = await Promise.all([getDaftarAkun(), getDaftarDojoKontingen()])

  const adaKunci = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Akun dojo & penguji</h1>
        <p className="text-muted-foreground">
          Peserta mendaftar sendiri. Dua peran ini hanya bisa dibuat dari sini.
        </p>
      </div>

      {!adaKunci ? (
        <Alert variant="destructive">
          <AlertTitle>Kunci service_role belum dipasang</AlertTitle>
          <AlertDescription>
            Membuat akun untuk orang lain mustahil lewat RLS, jadi bagian ini
            memakai service_role. Isi <code>SUPABASE_SERVICE_ROLE_KEY</code> di{" "}
            <code>.env.local</code> — ambil dari Dashboard &gt; Project Settings
            &gt; API keys — lalu jalankan ulang server.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Buat akun</CardTitle>
        </CardHeader>
        <CardContent>
          <FormAkun dojo={dojo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{akun.length} akun pengurus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Nama</th>
                  <th className="py-2 pr-4 font-medium">Peran</th>
                  <th className="py-2 pr-4 font-medium">Dojo</th>
                  <th className="py-2 font-medium">Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {akun.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{a.nama}</td>
                    <td className="py-2.5 pr-4">
                      <Lencana nada={a.peran === "kontingen" ? "baik" : "netral"}>
                        {LABEL_PERAN[a.peran]}
                      </Lencana>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {a.dojo?.nama ?? "—"}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("id-ID")}
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
