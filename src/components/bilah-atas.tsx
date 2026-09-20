import Link from "next/link"

import { aksiKeluar } from "@/app/(auth)/aksi"
import { LogoKKI } from "@/components/logo-kki"
import { Button } from "@/components/ui/button"
import { BERANDA_PERAN, LABEL_PERAN, type PenggunaSaatIni } from "@/lib/auth/sesi"

export function BilahAtas({ pengguna }: { pengguna: PenggunaSaatIni }) {
  return (
    <header className="border-b-2 border-merek bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href={BERANDA_PERAN[pengguna.peran]}
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <LogoKKI ukuran={34} />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight">SIKAT</span>
            <span className="text-[0.7rem] text-muted-foreground">
              {LABEL_PERAN[pengguna.peran]}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium">{pengguna.nama}</p>
            <p className="text-xs text-muted-foreground">{pengguna.email}</p>
          </div>
          <form action={aksiKeluar}>
            <Button type="submit" variant="outline" size="lg">
              Keluar
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
