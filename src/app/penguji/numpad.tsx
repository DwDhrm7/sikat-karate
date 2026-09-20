"use client"

import { Button } from "@/components/ui/button"

const TOMBOL = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "hapus", "0", "ok"]

/**
 * Numpad muncul sebagai lembar bawah, bukan input teks. Di tablet yang
 * dipegang sambil berdiri, papan ketik sistem menutup separuh tabel dan
 * angka kecilnya sulit ditekan tepat.
 */
export function Numpad({
  nama,
  noDada,
  ketikan,
  onKetik,
  onHapus,
  onSelesai,
  onBatal,
}: {
  nama: string
  noDada: string
  ketikan: string
  onKetik: (angka: string) => void
  onHapus: () => void
  onSelesai: () => void
  onBatal: () => void
}) {
  const nilai = Number(ketikan)
  const sah = ketikan !== "" && nilai >= 0 && nilai <= 100

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-merek bg-background p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
      <div className="mx-auto flex max-w-md flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-mono text-lg font-bold">{noDada}</p>
            <p className="text-sm text-muted-foreground">{nama}</p>
          </div>
          <p
            className={
              sah || ketikan === ""
                ? "text-5xl font-bold tabular-nums"
                : "text-5xl font-bold text-merek tabular-nums"
            }
          >
            {ketikan === "" ? "—" : ketikan}
          </p>
        </div>

        {!sah && ketikan !== "" ? (
          <p className="text-sm font-medium text-merek">Nilai harus 0–100.</p>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          {TOMBOL.map((t) => {
            if (t === "hapus") {
              return (
                <Button
                  key={t}
                  type="button"
                  variant="outline"
                  className="h-14 text-base"
                  onClick={onHapus}
                >
                  Hapus
                </Button>
              )
            }
            if (t === "ok") {
              return (
                <Button
                  key={t}
                  type="button"
                  className="h-14 text-base"
                  disabled={!sah}
                  onClick={onSelesai}
                >
                  Selesai
                </Button>
              )
            }
            return (
              <Button
                key={t}
                type="button"
                variant="outline"
                className="h-14 text-2xl font-bold tabular-nums"
                onClick={() => onKetik(t)}
              >
                {t}
              </Button>
            )
          })}
        </div>

        <Button type="button" variant="ghost" className="h-12" onClick={onBatal}>
          Batal
        </Button>
      </div>
    </div>
  )
}
