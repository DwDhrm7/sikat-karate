import Link from "next/link"

import { FormDaftar } from "./form-daftar"

export const metadata = { title: "Daftar — SIKAT" }

export default function HalamanDaftar() {
  return (
    <div className="space-y-4">
      <FormDaftar />
      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-medium text-foreground underline underline-offset-4">
          Masuk di sini
        </Link>
      </p>
    </div>
  )
}
