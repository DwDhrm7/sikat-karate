import { cn } from "@/lib/utils"
import type { NadaStatus } from "@/lib/status"

const NADA: Record<NadaStatus, string> = {
  netral: "bg-muted text-muted-foreground",
  proses: "bg-secondary text-secondary-foreground ring-1 ring-border",
  baik: "bg-foreground text-background",
  bahaya: "bg-merek text-merek-foreground",
}

export function Lencana({
  nada = "netral",
  children,
  className,
}: {
  nada?: NadaStatus
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        NADA[nada],
        className,
      )}
    >
      {children}
    </span>
  )
}
