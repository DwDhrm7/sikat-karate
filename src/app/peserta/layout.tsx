import { KerangkaPeran } from "@/components/kerangka-peran"
import { wajibPeran } from "@/lib/auth/sesi"
import { getPendaftaranSaya } from "@/lib/data/peserta"

import { NavPeserta } from "./nav-peserta"

export default async function LayoutPeserta({ children }: LayoutProps<"/peserta">) {
  const pengguna = await wajibPeran("peserta")
  const pendaftaran = await getPendaftaranSaya()

  return (
    <KerangkaPeran pengguna={pengguna}>
      <div className="space-y-6">
        {pendaftaran ? <NavPeserta /> : null}
        {children}
      </div>
    </KerangkaPeran>
  )
}
