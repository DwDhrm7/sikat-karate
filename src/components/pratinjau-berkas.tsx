import Link from "next/link"

/** Pratinjau berkas privat lewat URL bertanda tangan yang berumur pendek. */
export function PratinjauBerkas({
  url,
  path,
  alt,
}: {
  url: string | null
  path: string | null
  alt: string
}) {
  if (!url || !path) {
    return (
      <div className="grid h-32 w-full place-items-center rounded-lg border border-dashed border-border bg-muted/50 text-sm text-muted-foreground">
        Belum ada berkas
      </div>
    )
  }

  const pdf = path.toLowerCase().endsWith(".pdf")

  if (pdf) {
    return (
      <Link
        href={url}
        target="_blank"
        rel="noreferrer"
        className="grid h-32 w-full place-items-center rounded-lg border border-border bg-muted/50 text-sm font-medium underline underline-offset-4"
      >
        Buka PDF
      </Link>
    )
  }

  return (
    <Link href={url} target="_blank" rel="noreferrer" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className="h-32 w-full rounded-lg border border-border object-cover"
      />
    </Link>
  )
}
