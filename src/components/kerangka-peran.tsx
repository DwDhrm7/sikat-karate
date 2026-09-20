import { BilahAtas } from "@/components/bilah-atas"
import type { PenggunaSaatIni } from "@/lib/auth/sesi"

export function KerangkaPeran({
  pengguna,
  children,
}: {
  pengguna: PenggunaSaatIni
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <BilahAtas pengguna={pengguna} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
