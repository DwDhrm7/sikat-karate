import { z } from "zod"

const kataSandi = z
  .string()
  .min(8, { message: "Kata sandi minimal 8 karakter" })
  .max(72, { message: "Kata sandi maksimal 72 karakter" })

export const SkemaMasuk = z.object({
  email: z.email({ message: "Format email tidak sah" }),
  kata_sandi: z.string().min(1, { message: "Kata sandi wajib diisi" }),
  lanjut: z.string().optional(),
})

export const SkemaDaftar = z
  .object({
    nama: z
      .string()
      .trim()
      .min(3, { message: "Nama minimal 3 karakter" })
      .max(100, { message: "Nama maksimal 100 karakter" }),
    email: z.email({ message: "Format email tidak sah" }),
    no_hp: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s]{8,20}$/, { message: "Nomor HP tidak sah" })
      .optional()
      .or(z.literal("")),
    kata_sandi: kataSandi,
    konfirmasi_sandi: z.string(),
  })
  .refine((data) => data.kata_sandi === data.konfirmasi_sandi, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["konfirmasi_sandi"],
  })

export type MasukInput = z.infer<typeof SkemaMasuk>
export type DaftarInput = z.infer<typeof SkemaDaftar>
