import { cn } from "@/lib/utils"
import { LANGKAH_ALUR } from "@/lib/status"

export function LangkahAlur({ berjalan }: { berjalan: number }) {
  if (berjalan < 0) {
    return (
      <p className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
        Pendaftaran ini dibatalkan. Hubungi dojo bila ini keliru.
      </p>
    )
  }

  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {LANGKAH_ALUR.map((langkah, i) => {
        const selesai = i < berjalan
        const aktif = i === berjalan

        return (
          <li
            key={langkah.judul}
            className={cn(
              "flex gap-3 rounded-lg border p-3",
              aktif && "border-merek bg-merek-lembut",
              selesai && "border-border bg-background",
              !aktif && !selesai && "border-dashed border-border bg-transparent",
            )}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums",
                selesai && "bg-foreground text-background",
                aktif && "bg-merek text-merek-foreground",
                !aktif && !selesai && "bg-muted text-muted-foreground",
              )}
            >
              {selesai ? "✓" : i + 1}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block text-sm font-medium",
                  !aktif && !selesai && "text-muted-foreground",
                )}
              >
                {langkah.judul}
              </span>
              <span className="block text-xs text-muted-foreground">
                {langkah.keterangan}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
