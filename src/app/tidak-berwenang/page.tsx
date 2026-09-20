import Link from "next/link"

import { aksiKeluar } from "@/app/(auth)/aksi"
import { Button, buttonVariants } from "@/components/ui/button"
import { BERANDA_PERAN, LABEL_PERAN, getPenggunaSaatIni } from "@/lib/auth/sesi"

export const metadata = { title: "Tidak berwenang — SIKAT" }

export default async function HalamanTidakBerwenang() {
  const pengguna = await getPenggunaSaatIni()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-4 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Halaman ini bukan untuk peranmu</h1>
        <p className="max-w-md text-muted-foreground">
          {pengguna
            ? `Akun ini terdaftar sebagai ${LABEL_PERAN[pengguna.peran]}. Kalau seharusnya berbeda, hubungi panitia kontingen.`
            : "Sesi tidak dikenali. Silakan masuk kembali."}
        </p>
      </div>

      <div className="flex gap-3">
        {pengguna ? (
          <>
            <Link
              href={BERANDA_PERAN[pengguna.peran]}
              className={buttonVariants({ size: "lg" })}
            >
              Ke berandaku
            </Link>
            <form action={aksiKeluar}>
              <Button type="submit" variant="outline">
                Keluar
              </Button>
            </form>
          </>
        ) : (
          <Link href="/masuk" className={buttonVariants({ size: "lg" })}>
            Masuk
          </Link>
        )}
      </div>
    </div>
  )
}
