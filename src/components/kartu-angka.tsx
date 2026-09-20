import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function KartuAngka({
  judul,
  angka,
  keterangan,
}: {
  judul: string
  angka: number | string
  keterangan?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {judul}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums">{angka}</p>
        {keterangan ? (
          <p className="mt-1 text-xs text-muted-foreground">{keterangan}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
