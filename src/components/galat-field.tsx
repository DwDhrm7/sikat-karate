export function GalatField({ pesan }: { pesan?: string[] }) {
  if (!pesan?.length) return null

  return (
    <p role="alert" className="text-sm font-medium text-destructive">
      {pesan[0]}
    </p>
  )
}
