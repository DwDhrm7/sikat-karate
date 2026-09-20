import { redirect } from "next/navigation"

import { BERANDA_PERAN, getPenggunaSaatIni } from "@/lib/auth/sesi"

/** Pintu masuk tunggal: setiap peran dilempar ke berandanya sendiri. */
export default async function Beranda() {
  const pengguna = await getPenggunaSaatIni()

  if (!pengguna) redirect("/masuk")

  redirect(BERANDA_PERAN[pengguna.peran])
}
