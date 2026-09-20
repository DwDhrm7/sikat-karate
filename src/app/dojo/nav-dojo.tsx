"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const TAUTAN = [
  { href: "/dojo", label: "Beranda" },
  { href: "/dojo/peserta", label: "Peserta" },
  { href: "/dojo/peserta/baru", label: "Daftarkan" },
] as const

export function NavDojo() {
  const path = usePathname()

  return (
    <nav className="flex gap-1 border-b border-border">
      {TAUTAN.map((t) => {
        const aktif = path === t.href

        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={aktif ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
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
