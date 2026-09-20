"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PesertaDinilai } from "@/lib/data/penguji"
import { buatKlienBrowser } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

import { Numpad } from "./numpad"

type Nilai = {
  nilai: number
  hadir: boolean
  /** Hanya menjadi true setelah server mengembalikan id ini. Tidak pernah ditebak. */
  tersimpan: boolean
}

type Status = "diam" | "mengirim" | "gagal"

const JEDA_MAKS = 30

export function TabelPenilaian({
  peserta,
  nilaiBawaan,
  tingkatId,
  pengujiId,
  terkunci,
}: {
  peserta: PesertaDinilai[]
  nilaiBawaan: number
  tingkatId: string
  pengujiId: string
  terkunci: boolean
}) {
  const kunciSimpanan = `sikat:nilai:${pengujiId}:${tingkatId}`

  const [nilai, setNilai] = useState<Record<string, Nilai>>(() => {
    const awal: Record<string, Nilai> = {}
    for (const p of peserta) {
      awal[p.id] = p.penilaian
        ? { nilai: p.penilaian.nilai, hadir: p.penilaian.hadir, tersimpan: true }
        : { nilai: nilaiBawaan, hadir: true, tersimpan: false }
    }
    return awal
  })

  const [cari, setCari] = useState("")
  const [dojoDipilih, setDojoDipilih] = useState("")
  const [hanyaBelumDisentuh, setHanyaBelumDisentuh] = useState(false)

  const [status, setStatus] = useState<Status>("diam")
  const [pesanGalat, setPesanGalat] = useState<string | null>(null)
  const [detikLagi, setDetikLagi] = useState<number | null>(null)
  const [tenggat, setTenggat] = useState<number | null>(null)
  const [jumlahDitolak, setJumlahDitolak] = useState(0)

  const [numpadUntuk, setNumpadUntuk] = useState<string | null>(null)
  const [ketikan, setKetikan] = useState("")
  const [sudahPulih, setSudahPulih] = useState(false)

  const nilaiRef = useRef(nilai)
  const percobaanRef = useRef(0)

  useEffect(() => {
    nilaiRef.current = nilai
  }, [nilai])

  // Pulihkan perubahan yang belum sempat terkirim pada sesi sebelumnya.
  //
  // Pemulihan harus sesudah mount: localStorage tidak ada saat render server,
  // dan membacanya ketika render akan membuat markup server dan klien
  // berbeda. Satu render tambahan sekali muat adalah harga yang pantas untuk
  // tidak kehilangan nilai yang sudah diketik penguji.
  useEffect(() => {
    try {
      const mentah = localStorage.getItem(kunciSimpanan)

      if (mentah) {
        const simpanan = JSON.parse(mentah) as Record<string, Nilai>

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNilai((lama) => {
          const baru = { ...lama }
          for (const [id, v] of Object.entries(simpanan)) {
            if (baru[id] && !v.tersimpan) baru[id] = { ...v, tersimpan: false }
          }
          return baru
        })
      }
    } catch {
      // Simpanan rusak atau localStorage diblokir — mulai dari data server.
    } finally {
      setSudahPulih(true)
    }
  }, [kunciSimpanan])

  useEffect(() => {
    // Gerbang ini yang mencegah draf terhapus oleh dirinya sendiri.
    //
    // Kedua efek berjalan pada commit yang sama saat mount, dan efek ini
    // berjalan sesudah efek pemulih tetapi SEBELUM setNilai-nya diterapkan.
    // Tanpa gerbang, tulisan pertama di sini menimpa localStorage dengan
    // data server yang belum memuat draf — dan draf penguji lenyap justru
    // karena mekanisme yang seharusnya menjaganya.
    if (!sudahPulih) return

    try {
      localStorage.setItem(kunciSimpanan, JSON.stringify(nilai))
    } catch {
      // Kuota penuh atau mode privat. Data tetap hidup di memori.
    }
  }, [nilai, kunciSimpanan, sudahPulih])

  const belumTersimpan = useMemo(
    () => Object.values(nilai).filter((v) => !v.tersimpan).length,
    [nilai],
  )

  const disentuh = useMemo(
    () =>
      Object.values(nilai).filter((v) => v.nilai !== nilaiBawaan || !v.hadir).length,
    [nilai, nilaiBawaan],
  )

  const kirim = useCallback(async () => {
    const antre = Object.entries(nilaiRef.current).filter(([, v]) => !v.tersimpan)
    if (antre.length === 0 || terkunci) return

    setStatus("mengirim")
    setPesanGalat(null)
    setDetikLagi(null)
    setTenggat(null)

    try {
      const supabase = buatKlienBrowser()
      const { data, error } = await supabase.rpc("simpan_penilaian", {
        p_items: antre.map(([id, v]) => ({
          peserta_id: id,
          nilai: v.nilai,
          hadir: v.hadir,
        })),
      })

      if (error) throw new Error(error.message)

      // Hanya id yang dikembalikan server yang boleh ditandai tersimpan.
      const dikonfirmasi = new Set((data as unknown as string[]) ?? [])

      setNilai((lama) => {
        const baru = { ...lama }
        for (const id of dikonfirmasi) {
          if (baru[id]) baru[id] = { ...baru[id], tersimpan: true }
        }
        return baru
      })

      setJumlahDitolak(antre.length - dikonfirmasi.size)
      percobaanRef.current = 0
      setStatus("diam")
    } catch (e) {
      percobaanRef.current += 1
      const jeda = Math.min(JEDA_MAKS, 2 ** percobaanRef.current)
      setStatus("gagal")
      setPesanGalat(e instanceof Error ? e.message : "Sambungan terputus")
      setDetikLagi(jeda)
      setTenggat(Date.now() + jeda * 1000)
    }
  }, [terkunci])

  // Hitung mundur percobaan ulang. Tenggatnya disimpan sebagai waktu
  // absolut, bukan pencacah yang mengurangi dirinya sendiri — kalau tablet
  // tidur sebentar, hitungannya tetap benar saat bangun.
  useEffect(() => {
    if (tenggat === null) return

    const jalan = () => {
      const sisa = Math.ceil((tenggat - Date.now()) / 1000)
      if (sisa > 0) {
        setDetikLagi(sisa)
        return
      }
      setTenggat(null)
      setDetikLagi(null)
      void kirim()
    }

    const t = setInterval(jalan, 400)
    return () => clearInterval(t)
  }, [tenggat, kirim])

  // Begitu jaringan kembali, jangan tunggu hitungan mundur selesai.
  useEffect(() => {
    const kembali = () => void kirim()
    window.addEventListener("online", kembali)
    return () => window.removeEventListener("online", kembali)
  }, [kirim])

  useEffect(() => {
    if (belumTersimpan === 0) return

    const cegah = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", cegah)
    return () => window.removeEventListener("beforeunload", cegah)
  }, [belumTersimpan])

  function ubah(id: string, delta: number) {
    if (terkunci) return
    setNilai((lama) => {
      const v = lama[id]
      if (!v) return lama
      const baru = Math.min(100, Math.max(0, v.nilai + delta))
      if (baru === v.nilai) return lama
      return { ...lama, [id]: { ...v, nilai: baru, tersimpan: false } }
    })
  }

  function setAngka(id: string, angka: number) {
    if (terkunci) return
    setNilai((lama) => {
      const v = lama[id]
      if (!v) return lama
      return { ...lama, [id]: { ...v, nilai: angka, tersimpan: false } }
    })
  }

  function balikHadir(id: string) {
    if (terkunci) return
    setNilai((lama) => {
      const v = lama[id]
      if (!v) return lama
      return { ...lama, [id]: { ...v, hadir: !v.hadir, tersimpan: false } }
    })
  }

  const daftarDojo = useMemo(() => {
    const peta = new Map<string, string>()
    for (const p of peserta) if (p.dojo) peta.set(p.dojo.id, p.dojo.nama)
    return [...peta.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [peserta])

  const terlihat = useMemo(() => {
    const q = cari.trim().toLowerCase()

    return peserta.filter((p) => {
      if (dojoDipilih && p.dojo?.id !== dojoDipilih) return false

      if (hanyaBelumDisentuh) {
        const v = nilai[p.id]
        if (!v || v.nilai !== nilaiBawaan || !v.hadir) return false
      }

      if (q) {
        return (
          (p.no_dada ?? "").toLowerCase().includes(q) ||
          p.nama_lengkap.toLowerCase().includes(q)
        )
      }

      return true
    })
  }, [peserta, cari, dojoDipilih, hanyaBelumDisentuh, nilai, nilaiBawaan])

  const pesertaNumpad = numpadUntuk ? peserta.find((p) => p.id === numpadUntuk) : null

  return (
    <div className="space-y-4 pb-40">
      {/* Bilah kendali menempel di atas: indikator belum tersimpan harus
          selalu terlihat, tidak ikut tergulung bersama tabel. */}
      <div className="sticky top-0 z-20 -mx-4 space-y-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nomor dada atau nama"
            aria-label="Cari nomor dada atau nama"
            className="h-12 w-full text-base sm:w-64"
          />

          <select
            value={dojoDipilih}
            onChange={(e) => setDojoDipilih(e.target.value)}
            aria-label="Saring per dojo"
            className="h-12 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Semua dojo</option>
            {daftarDojo.map(([id, nama]) => (
              <option key={id} value={id}>
                {nama}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant={hanyaBelumDisentuh ? "default" : "outline"}
            className="h-12 px-4 text-base"
            aria-pressed={hanyaBelumDisentuh}
            onClick={() => setHanyaBelumDisentuh((b) => !b)}
          >
            Belum disentuh
          </Button>

          <div className="ml-auto flex items-center gap-3">
            <IndikatorSimpan
              status={status}
              belum={belumTersimpan}
              detikLagi={detikLagi}
              pesanGalat={pesanGalat}
            />
            <Button
              type="button"
              className="h-12 px-6 text-base"
              disabled={belumTersimpan === 0 || status === "mengirim" || terkunci}
              onClick={() => void kirim()}
              data-uji="simpan-semua"
            >
              {status === "mengirim" ? "Menyimpan…" : "Simpan Semua"}
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {terlihat.length} dari {peserta.length} peserta ditampilkan · {disentuh}{" "}
          nilai menyimpang dari bawaan {nilaiBawaan}
          {jumlahDitolak > 0 ? (
            <span className="font-medium text-merek">
              {" "}
              · {jumlahDitolak} ditolak server
            </span>
          ) : null}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm text-muted-foreground">
              <th className="px-3 py-2 font-medium">Nomor</th>
              <th className="px-3 py-2 font-medium">Nama</th>
              <th className="px-3 py-2 font-medium">Nilai</th>
              <th className="px-3 py-2 font-medium">Kehadiran</th>
              <th className="px-3 py-2 font-medium">Simpan</th>
            </tr>
          </thead>

          <tbody>
            {terlihat.map((p) => {
              const v = nilai[p.id]
              if (!v) return null

              const berubah = v.nilai !== nilaiBawaan || !v.hadir
              const barisTerkunci = terkunci || p.penilaian?.dikunci === true

              return (
                <tr
                  key={p.id}
                  data-uji="baris"
                  data-nomor={p.no_dada ?? ""}
                  data-berubah={berubah ? "ya" : "tidak"}
                  data-tersimpan={v.tersimpan ? "ya" : "tidak"}
                  className={cn(
                    "h-16 border-b border-border last:border-0",
                    berubah && "border-l-4 border-l-merek bg-merek-lembut/50",
                  )}
                >
                  <td className="px-3 font-mono text-lg font-bold whitespace-nowrap">
                    {p.no_dada}
                  </td>

                  <td className="px-3">
                    <p className={cn("font-medium", !v.hadir && "line-through opacity-60")}>
                      {p.nama_lengkap}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.dojo?.nama}</p>
                  </td>

                  <td className="px-3">
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        className="size-12 shrink-0 text-2xl leading-none"
                        aria-label={`Kurangi nilai ${p.no_dada}`}
                        disabled={barisTerkunci || !v.hadir}
                        onClick={() => ubah(p.id, -1)}
                      >
                        −
                      </Button>

                      <button
                        type="button"
                        aria-label={`Ubah nilai ${p.no_dada} lewat numpad`}
                        disabled={barisTerkunci || !v.hadir}
                        onClick={() => {
                          setNumpadUntuk(p.id)
                          setKetikan("")
                        }}
                        className={cn(
                          "h-12 w-16 rounded-lg text-3xl font-bold tabular-nums",
                          "hover:bg-accent disabled:opacity-40",
                          berubah && v.hadir && "text-merek",
                        )}
                        data-uji="nilai"
                      >
                        {v.hadir ? v.nilai : "—"}
                      </button>

                      <Button
                        type="button"
                        variant="outline"
                        className="size-12 shrink-0 text-2xl leading-none"
                        aria-label={`Tambah nilai ${p.no_dada}`}
                        disabled={barisTerkunci || !v.hadir}
                        onClick={() => ubah(p.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                  </td>

                  <td className="px-3">
                    <Button
                      type="button"
                      variant={v.hadir ? "outline" : "destructive"}
                      className="h-12 px-4 whitespace-nowrap"
                      aria-pressed={!v.hadir}
                      disabled={barisTerkunci}
                      onClick={() => balikHadir(p.id)}
                      data-uji="hadir"
                    >
                      {v.hadir ? "Hadir" : "Tidak hadir"}
                    </Button>
                  </td>

                  <td className="px-3">
                    {v.tersimpan ? (
                      <span
                        className="text-lg font-bold"
                        title="Sudah dikonfirmasi server"
                        aria-label="Tersimpan"
                      >
                        ✓
                      </span>
                    ) : (
                      <span
                        className="text-lg font-bold text-merek"
                        title="Belum dikonfirmasi server"
                        aria-label="Belum tersimpan"
                      >
                        •
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {terlihat.length === 0 ? (
          <p className="px-3 py-12 text-center text-muted-foreground">
            Tidak ada peserta yang cocok dengan saringan ini.
          </p>
        ) : null}
      </div>

      {pesertaNumpad ? (
        <Numpad
          nama={pesertaNumpad.nama_lengkap}
          noDada={pesertaNumpad.no_dada ?? ""}
          ketikan={ketikan}
          onKetik={(a) => setKetikan((k) => (k + a).slice(0, 3))}
          onHapus={() => setKetikan((k) => k.slice(0, -1))}
          onBatal={() => setNumpadUntuk(null)}
          onSelesai={() => {
            const angka = Number(ketikan)
            if (ketikan !== "" && angka >= 0 && angka <= 100) {
              setAngka(pesertaNumpad.id, angka)
            }
            setNumpadUntuk(null)
          }}
        />
      ) : null}
    </div>
  )
}

function IndikatorSimpan({
  status,
  belum,
  detikLagi,
  pesanGalat,
}: {
  status: Status
  belum: number
  detikLagi: number | null
  pesanGalat: string | null
}) {
  if (status === "gagal") {
    return (
      <p
        data-uji="indikator"
        className="text-sm font-medium text-merek"
        role="status"
      >
        Gagal terkirim
        {detikLagi !== null ? `, mencoba lagi ${detikLagi} dtk` : ""}
        {pesanGalat ? ` · ${pesanGalat}` : ""}
      </p>
    )
  }

  if (status === "mengirim") {
    return (
      <p data-uji="indikator" className="text-sm text-muted-foreground" role="status">
        Mengirim {belum} perubahan…
      </p>
    )
  }

  if (belum === 0) {
    return (
      <p data-uji="indikator" className="text-sm font-medium" role="status">
        Semua tersimpan
      </p>
    )
  }

  return (
    <p data-uji="indikator" className="text-sm font-medium text-merek" role="status">
      {belum} belum tersimpan
    </p>
  )
}
