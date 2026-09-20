"use server"

import { revalidatePath } from "next/cache"

import { wajibMasuk } from "@/lib/auth/sesi"
import {
  BUCKET_BERKAS,
  BUCKET_BUKTI,
  LABEL_BERKAS,
  berkasDiperlukan,
  type JenisBerkas,
} from "@/lib/berkas"
import { buatKlienServer } from "@/lib/supabase/server"

export type StatusAksi = {
  galat?: string
  sukses?: string
  galatField?: Record<string, string[] | undefined>
}

/**
 * Aksi di berkas ini menerima pesertaId secara terbuka dan TIDAK memeriksa
 * sendiri siapa pemiliknya. Yang memutuskan adalah RLS:
 * boleh_ubah_berkas() hanya meloloskan pemiliknya selama masih boleh
 * disunting, dojo yang menaungi, dan kontingen. Dengan begitu peserta dan
 * dojo memakai jalur kode yang sama tanpa pagar ganda yang bisa berbeda
 * pendapat.
 *
 * Satu hal tetap diperiksa di sini: path harus berada di bawah folder
 * peserta yang bersangkutan, karena path datang dari klien.
 */
function pathSah(path: string, pesertaId: string): boolean {
  return path.startsWith(`${pesertaId}/`) && !path.includes("..")
}

export async function aksiCatatBerkas(
  pesertaId: string,
  jenis: JenisBerkas,
  pathBaru: string,
): Promise<StatusAksi> {
  await wajibMasuk()

  if (!pathSah(pathBaru, pesertaId)) {
    return { galat: "Path berkas tidak sah." }
  }

  const supabase = await buatKlienServer()

  const { data: lama } = await supabase
    .from("berkas_peserta")
    .select("path_storage")
    .eq("peserta_id", pesertaId)
    .eq("jenis", jenis)
    .maybeSingle()

  const { error } = await supabase.from("berkas_peserta").upsert(
    {
      peserta_id: pesertaId,
      jenis,
      path_storage: pathBaru,
      status: "menunggu",
      alasan_tolak: null,
      diverifikasi_oleh: null,
      diverifikasi_pada: null,
    },
    { onConflict: "peserta_id,jenis" },
  )

  if (error) return { galat: `Gagal mencatat berkas: ${error.message}` }

  if (lama?.path_storage && lama.path_storage !== pathBaru) {
    await supabase.storage.from(BUCKET_BERKAS).remove([lama.path_storage])
  }

  revalidatePath("/", "layout")
  return { sukses: "Berkas terunggah." }
}

export async function aksiCatatBukti(
  pesertaId: string,
  pathBaru: string,
): Promise<StatusAksi> {
  await wajibMasuk()

  if (!pathSah(pathBaru, pesertaId)) {
    return { galat: "Path bukti tidak sah." }
  }

  const supabase = await buatKlienServer()

  const { data: lama } = await supabase
    .from("pembayaran")
    .select("id, path_bukti")
    .eq("peserta_id", pesertaId)
    .maybeSingle()

  if (!lama) return { galat: "Tagihan tidak ditemukan." }

  const { error } = await supabase
    .from("pembayaran")
    .update({
      path_bukti: pathBaru,
      status: "menunggu",
      alasan_tolak: null,
      diverifikasi_oleh: null,
      diverifikasi_pada: null,
    })
    .eq("id", lama.id)

  if (error) return { galat: `Gagal mencatat bukti: ${error.message}` }

  if (lama.path_bukti && lama.path_bukti !== pathBaru) {
    await supabase.storage.from(BUCKET_BUKTI).remove([lama.path_bukti])
  }

  revalidatePath("/", "layout")
  return { sukses: "Bukti transfer terunggah." }
}

export async function aksiKirimVerifikasi(pesertaId: string): Promise<StatusAksi> {
  await wajibMasuk()
  const supabase = await buatKlienServer()

  const { data: peserta } = await supabase
    .from("peserta")
    .select(
      `id, status,
       tingkat ( wajib_sertifikat_terakhir ),
       pembayaran ( path_bukti ),
       berkas_peserta ( jenis )`,
    )
    .eq("id", pesertaId)
    .maybeSingle()

  if (!peserta) return { galat: "Pendaftaran tidak ditemukan." }

  if (peserta.status !== "draft" && peserta.status !== "ditolak") {
    return { galat: "Pendaftaran ini sudah dikirim dan sedang diproses." }
  }

  const perlu = berkasDiperlukan(peserta.tingkat?.wajib_sertifikat_terakhir ?? true)
  const sudahAda = new Set(peserta.berkas_peserta.map((b) => b.jenis))
  const kurang = perlu.filter((jenis) => !sudahAda.has(jenis))

  if (kurang.length > 0) {
    return {
      galat: `Belum bisa dikirim. Berkas yang kurang: ${kurang
        .map((jenis) => LABEL_BERKAS[jenis])
        .join(", ")}.`,
    }
  }

  if (!peserta.pembayaran?.path_bukti) {
    return { galat: "Belum bisa dikirim. Bukti transfer belum diunggah." }
  }

  const { error } = await supabase
    .from("peserta")
    .update({ status: "menunggu_verifikasi" })
    .eq("id", peserta.id)

  if (error) return { galat: `Gagal mengirim: ${error.message}` }

  revalidatePath("/", "layout")
  return { sukses: "Terkirim. Dojo akan memeriksa berkasnya." }
}
