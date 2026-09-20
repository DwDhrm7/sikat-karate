import { KerangkaPeran } from "@/components/kerangka-peran"
import { wajibPeran } from "@/lib/auth/sesi"

import { NavKontingen } from "./nav-kontingen"

export default async function LayoutKontingen({ children }: LayoutProps<"/kontingen">) {
  const pengguna = await wajibPeran("kontingen")

  return (
    <KerangkaPeran pengguna={pengguna}>
      <div className="space-y-6">
        <NavKontingen />
        {children}
      </div>
    </KerangkaPeran>
  )
}
