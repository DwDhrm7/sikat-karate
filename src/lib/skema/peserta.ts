import { z } from "zod"

const HARI_INI = () => new Date().toISOString().slice(0, 10)

export const SkemaPendaftaran = z.object({
  tingkat_id: z.uuid({ message: "Tingkat wajib dipilih" }),
  dojo_id: z.uuid({ message: "Dojo wajib dipilih" }),
  nama_lengkap: z
    .string()
    .trim()
    .min(3, { message: "Nama minimal 3 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
  tgl_lahir: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Tanggal lahir wajib diisi" })
    .refine((t) => t <= HARI_INI(), { message: "Tanggal lahir tidak boleh di masa depan" })
    .refine((t) => t >= "1930-01-01", { message: "Tanggal lahir tidak masuk akal" }),
  jenis_kelamin: z.enum(["L", "P"], { message: "Jenis kelamin wajib dipilih" }),
})

export type PendaftaranInput = z.infer<typeof SkemaPendaftaran>
