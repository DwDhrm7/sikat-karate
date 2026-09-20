import { aksiKeluar } from "@/app/(auth)/aksi"
import { LogoKKI } from "@/components/logo-kki"
import { Button } from "@/components/ui/button"
import { wajibPeran } from "@/lib/auth/sesi"

/**
 * Penguji memegang tablet sambil berdiri di lapangan dan hanya punya satu
 * pekerjaan. Tidak ada navigasi, tidak ada lebar maksimum — tabel memakai
 * seluruh layar.
 */
export default async function LayoutPenguji({ children }: LayoutProps<"/penguji">) {
  const pengguna = await wajibPeran("penguji")

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b-2 border-merek bg-background">
        <div className="flex h-14 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2.5">
            <LogoKKI ukuran={28} />
            <span className="font-bold tracking-tight">SIKAT</span>
            <span className="text-sm text-muted-foreground">Penilaian</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium sm:inline">{pengguna.nama}</span>
            <form action={aksiKeluar}>
              <Button type="submit" variant="outline" size="lg">
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">{children}</main>
    </div>
  )
}
