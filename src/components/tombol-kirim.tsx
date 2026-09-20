"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function TombolKirim({
  children,
  sedangProses = "Memproses…",
  className,
}: {
  children: React.ReactNode
  sedangProses?: string
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn("h-11 w-full text-base", className)}
    >
      {pending ? sedangProses : children}
    </Button>
  )
}
