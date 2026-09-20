"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const TAUTAN = [
  { href: "/kontingen", label: "Progres" },
  { href: "/kontingen/event", label: "Event & tingkat" },
  { href: "/kontingen/dojo", label: "Dojo" },
  { href: "/kontingen/akun", label: "Akun" },
  { href: "/kontingen/penguji", label: "Penguji" },
  { href: "/kontingen/audit", label: "Audit" },
] as const

export function NavKontingen() {
  const path = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {TAUTAN.map((t) => {
        const aktif = path === t.href

        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={aktif ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              aktif
                ? "border-merek text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
