import "server-only"

import { getPenggunaSaatIni, type PenggunaSaatIni } from "@/lib/auth/sesi"

/**
 * Hanya dojo dan kontingen yang mencetak. Dojo selalu dipaksa ke dojonya
 * sendiri: RLS memang sudah menyaring, tetapi memaksanya di sini membuat
 * hasilnya jelas keliru ketimbang diam-diam kosong.
 */
export async function pencetak(
  dojoDiminta: string | null,
): Promise<{ pengguna: PenggunaSaatIni; dojoId: string | null } | null> {
  const pengguna = await getPenggunaSaatIni()

  if (!pengguna) return null
  if (pengguna.peran !== "dojo" && pengguna.peran !== "kontingen") return null

  return {
    pengguna,
    dojoId: pengguna.peran === "dojo" ? pengguna.dojoId : dojoDiminta,
  }
}

export function tanggalPanjang(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
