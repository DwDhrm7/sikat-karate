"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

import { aksiHapusTugas } from "../aksi"

export function TombolHapusTugas({ tugasId }: { tugasId: string }) {
  const [yakin, setYakin] = useState(false)
  const [sibuk, mulai] = useTransition()
  const router = useRouter()

  if (!yakin) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setYakin(true)}>
        Hapus
      </Button>
    )
  }

  return (
    <span className="flex gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={sibuk}
        onClick={() =>
          mulai(async () => {
            await aksiHapusTugas(tugasId)
            router.refresh()
          })
        }
      >
        {sibuk ? "…" : "Yakin"}
      </Button>
      <Button variant="ghost" size="sm" disabled={sibuk} onClick={() => setYakin(false)}>
        Batal
      </Button>
    </span>
  )
}
