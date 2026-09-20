"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LABEL_BERKAS, type JenisBerkas } from "@/lib/berkas"

import { aksiTolakPeserta, aksiVerifikasiMassal } from "../../aksi"

export function PanelVerifikasi({
  pesertaId,
  jenisTersedia,
  adaBukti,
}: {
  pesertaId: string
  jenisTersedia: JenisBerkas[]
  adaBukti: boolean
}) {
  const [modeTolak, setModeTolak] = useState(false)
  const [alasan, setAlasan] = useState("")
  const [jenisDitolak, setJenisDitolak] = useState<Set<JenisBerkas>>(new Set())
  const [tolakBayar, setTolakBayar] = useState(false)
  const [pesan, setPesan] = useState<{ galat?: string; sukses?: string }>({})
  const [sibuk, mulai] = useTransition()
  const router = useRouter()

  function setujui() {
    setPesan({})
    mulai(async () => {
      const hasil = await aksiVerifikasiMassal([pesertaId])
      setPesan({ galat: hasil.galat, sukses: hasil.sukses })
      if (!hasil.galat) router.refresh()
    })
  }

  function tolak() {
    setPesan({})
    mulai(async () => {
      const hasil = await aksiTolakPeserta(
        pesertaId,
        alasan,
        [...jenisDitolak],
        tolakBayar,
      )
      setPesan({ galat: hasil.galat, sukses: hasil.sukses })
      if (!hasil.galat) {
        setModeTolak(false)
        setAlasan("")
        setJenisDitolak(new Set())
        setTolakBayar(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      {pesan.galat ? (
        <Alert variant="destructive">
          <AlertDescription>{pesan.galat}</AlertDescription>
        </Alert>
      ) : null}
      {pesan.sukses ? (
        <Alert>
          <AlertDescription>{pesan.sukses}</AlertDescription>
        </Alert>
      ) : null}

      {!modeTolak ? (
        <div className="flex flex-wrap gap-2">
          <Button size="lg" disabled={sibuk} onClick={setujui}>
            {sibuk ? "Memproses…" : "Setujui pendaftaran"}
          </Button>
          <Button
            size="lg"
            variant="destructive"
            disabled={sibuk}
            onClick={() => setModeTolak(true)}
          >
            Tolak
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Bagian mana yang bermasalah?</p>
            <div className="space-y-1.5">
              {jenisTersedia.map((j) => (
                <label key={j} className="flex items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    className="size-5 accent-[var(--merek)]"
                    checked={jenisDitolak.has(j)}
                    onChange={(e) =>
                      setJenisDitolak((lama) => {
                        const baru = new Set(lama)
                        if (e.target.checked) baru.add(j)
                        else baru.delete(j)
                        return baru
                      })
                    }
                  />
                  {LABEL_BERKAS[j]}
                </label>
              ))}
              {adaBukti ? (
                <label className="flex items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    className="size-5 accent-[var(--merek)]"
                    checked={tolakBayar}
                    onChange={(e) => setTolakBayar(e.target.checked)}
                  />
                  Bukti transfer
                </label>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Boleh dikosongkan kalau masalahnya bukan pada berkas, misalnya
              nama yang keliru.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alasan">Alasan penolakan</Label>
            <Textarea
              id="alasan"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={3}
              placeholder="Tulis yang jelas — kalimat ini yang dibaca peserta saat memperbaiki."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              variant="destructive"
              disabled={sibuk || !alasan.trim()}
              onClick={tolak}
            >
              {sibuk ? "Mengirim…" : "Kembalikan ke peserta"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={sibuk}
              onClick={() => setModeTolak(false)}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
