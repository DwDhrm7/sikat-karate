import Link from "next/link"

import { LogoKKI } from "@/components/logo-kki"

export default function LayoutAuth({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <Link href="/" className="flex flex-col items-center gap-2">
        <LogoKKI ukuran={64} />
        <span className="flex flex-col items-center leading-tight">
          <span className="text-3xl font-bold tracking-tight">SIKAT</span>
          <span className="text-sm text-muted-foreground">
            Sistem Ujian Kenaikan Tingkat
          </span>
        </span>
      </Link>

      <div className="w-full max-w-sm">{children}</div>

      <p className="text-xs text-muted-foreground">
        Kushin Ryu M Karate-Do Indonesia
      </p>
    </div>
  )
}
