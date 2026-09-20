import { KerangkaPeran } from "@/components/kerangka-peran"
import { wajibPeran } from "@/lib/auth/sesi"

import { NavDojo } from "./nav-dojo"

export default async function LayoutDojo({ children }: LayoutProps<"/dojo">) {
  const pengguna = await wajibPeran("dojo")

  return (
    <KerangkaPeran pengguna={pengguna}>
      <div className="space-y-6">
        <NavDojo />
        {children}
      </div>
    </KerangkaPeran>
  )
}
