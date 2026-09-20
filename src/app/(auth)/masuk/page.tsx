import Link from "next/link"

import { FormMasuk } from "./form-masuk"

export const metadata = { title: "Masuk — SIKAT" }

export default async function HalamanMasuk({ searchParams }: PageProps<"/masuk">) {
  const { lanjut } = await searchParams

  return (
    <div className="space-y-4">
      <FormMasuk lanjut={typeof lanjut === "string" ? lanjut : undefined} />
      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-medium text-foreground underline underline-offset-4">
          Daftar di sini
        </Link>
      </p>
    </div>
  )
}
