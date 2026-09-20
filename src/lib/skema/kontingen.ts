import { z } from "zod"

export const SkemaEvent = z.object({
  nama: z.string().trim().min(5, { message: "Nama event minimal 5 karakter" }).max(150),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Tanggal wajib diisi" }),
  lokasi: z.string().trim().max(150).optional().or(z.literal("")),
})

export const SkemaStatusEvent = z.object({
  event_id: z.uuid(),
  status: z.enum([
    "draft",
    "pendaftaran_dibuka",
    "pendaftaran_ditutup",
    "berlangsung",
    "selesai",
  ]),
})

const angka = (pesan: string) =>
  z.coerce.number({ message: pesan }).int({ message: pesan })

export const SkemaTingkat = z.object({
  event_id: z.uuid(),
  kode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,4}$/, { message: "Kode 2–4 huruf kapital, mis. PK" }),
  nama: z.string().trim().min(3, { message: "Nama tingkat minimal 3 karakter" }).max(100),
  sabuk_asal: z.string().trim().min(2, { message: "Sabuk asal wajib diisi" }).max(40),
  sabuk_tujuan: z.string().trim().min(2, { message: "Sabuk tujuan wajib diisi" }).max(40),
  biaya: angka("Biaya harus angka bulat").min(0, { message: "Biaya tidak boleh minus" }),
  nilai_bawaan: angka("Nilai bawaan harus angka bulat")
    .min(0, { message: "Nilai bawaan 0–100" })
    .max(100, { message: "Nilai bawaan 0–100" }),
  batas_lulus: angka("Batas lulus harus angka bulat")
    .min(0, { message: "Batas lulus 0–100" })
    .max(100, { message: "Batas lulus 0–100" }),
  urutan: angka("Urutan harus angka bulat").min(1).max(99),
  wajib_sertifikat_terakhir: z.coerce.boolean(),
})

export const SkemaDojo = z.object({
  nama: z.string().trim().min(3, { message: "Nama dojo minimal 3 karakter" }).max(100),
  kode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,5}$/, { message: "Kode 2–5 huruf kapital, mis. BKY" }),
  kota: z.string().trim().max(60).optional().or(z.literal("")),
  nama_ketua: z.string().trim().max(100).optional().or(z.literal("")),
})

export const SkemaAkun = z
  .object({
    peran: z.enum(["dojo", "penguji"], { message: "Peran wajib dipilih" }),
    nama: z.string().trim().min(3, { message: "Nama minimal 3 karakter" }).max(100),
    email: z.email({ message: "Format email tidak sah" }),
    kata_sandi: z
      .string()
      .min(8, { message: "Kata sandi minimal 8 karakter" })
      .max(72),
    dojo_id: z.union([z.uuid(), z.literal("")]).optional(),
  })
  .refine((d) => d.peran !== "dojo" || (d.dojo_id && d.dojo_id !== ""), {
    message: "Akun dojo wajib terhubung ke sebuah dojo",
    path: ["dojo_id"],
  })

export const SkemaTugas = z
  .object({
    tingkat_id: z.uuid({ message: "Tingkat wajib dipilih" }),
    penguji_user_id: z.uuid({ message: "Penguji wajib dipilih" }),
    no_awal: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
    no_akhir: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
  })
  .refine(
    (d) => (d.no_awal === "" || d.no_awal === undefined) === (d.no_akhir === "" || d.no_akhir === undefined),
    { message: "Isi kedua nomor, atau kosongkan keduanya untuk seluruh tingkat", path: ["no_akhir"] },
  )
  .refine(
    (d) =>
      typeof d.no_awal !== "number" ||
      typeof d.no_akhir !== "number" ||
      d.no_awal <= d.no_akhir,
    { message: "Nomor awal harus lebih kecil dari nomor akhir", path: ["no_akhir"] },
  )
