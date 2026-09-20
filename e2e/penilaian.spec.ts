import { expect, test } from "@playwright/test"

const BARIS = '[data-uji="baris"]'
const INDIKATOR = '[data-uji="indikator"]'

test.beforeEach(async ({ page }) => {
  await page.goto("/penguji")
  await expect(page.locator(BARIS).first()).toBeVisible()
})

test("memuat seluruh rentang penguji sekaligus, tanpa paginasi", async ({ page }) => {
  // penguji1 memegang PK-001 sampai PK-110
  await expect(page.locator(BARIS)).toHaveCount(110)
  await expect(page.locator(BARIS).first()).toHaveAttribute("data-nomor", "PK-001")
  await expect(page.locator(BARIS).nth(109)).toHaveAttribute("data-nomor", "PK-110")
  await expect(page.getByText(/Tanggung jawabmu: PK-001 s\/d PK-110/)).toBeVisible()
})

test("target sentuh memenuhi ukuran minimum tablet", async ({ page }) => {
  const baris = page.locator(BARIS).first()
  const tinggiBaris = (await baris.boundingBox())!.height
  expect(tinggiBaris).toBeGreaterThanOrEqual(56)

  for (const nama of ["Tambah nilai PK-001", "Kurangi nilai PK-001"]) {
    const kotak = (await page.getByRole("button", { name: nama }).boundingBox())!
    expect(kotak.width).toBeGreaterThanOrEqual(44)
    expect(kotak.height).toBeGreaterThanOrEqual(44)
  }

  const hadir = (await baris.locator('[data-uji="hadir"]').boundingBox())!
  expect(hadir.height).toBeGreaterThanOrEqual(44)
})

test("baris yang menyimpang dari nilai bawaan diberi penanda", async ({ page }) => {
  const baris = page.locator(BARIS).first()
  await expect(baris).toHaveAttribute("data-berubah", "tidak")

  await page.getByRole("button", { name: "Tambah nilai PK-001" }).click()

  await expect(baris.locator('[data-uji="nilai"]')).toHaveText("81")
  await expect(baris).toHaveAttribute("data-berubah", "ya")

  // kembali ke bawaan, penanda ikut hilang
  await page.getByRole("button", { name: "Kurangi nilai PK-001" }).click()
  await expect(baris).toHaveAttribute("data-berubah", "tidak")
})

test("numpad mengisi nilai tepat dan menolak di luar 0-100", async ({ page }) => {
  const baris = page.locator(BARIS).first()

  await baris.locator('[data-uji="nilai"]').click()
  await page.getByRole("button", { name: "1", exact: true }).click()
  await page.getByRole("button", { name: "5", exact: true }).click()
  await page.getByRole("button", { name: "0", exact: true }).click()

  // 150 di luar jangkauan: tombol Selesai harus mati
  await expect(page.getByRole("button", { name: "Selesai" })).toBeDisabled()
  await expect(page.getByText("Nilai harus 0–100.")).toBeVisible()

  await page.getByRole("button", { name: "Hapus" }).click()
  await expect(page.getByRole("button", { name: "Selesai" })).toBeEnabled()
  await page.getByRole("button", { name: "Selesai" }).click()

  await expect(baris.locator('[data-uji="nilai"]')).toHaveText("15")
})

test("tidak hadir mematikan penilaian baris itu", async ({ page }) => {
  const baris = page.locator(BARIS).nth(1)

  await baris.locator('[data-uji="hadir"]').click()

  await expect(baris.locator('[data-uji="hadir"]')).toHaveText("Tidak hadir")
  await expect(baris.locator('[data-uji="nilai"]')).toHaveText("—")
  await expect(baris.locator('[data-uji="nilai"]')).toBeDisabled()
  await expect(baris).toHaveAttribute("data-berubah", "ya")
})

test("pencarian dan saringan mempersempit tabel", async ({ page }) => {
  await page.getByLabel("Cari nomor dada atau nama").fill("PK-05")
  await expect(page.locator(BARIS)).toHaveCount(10)

  await page.getByLabel("Cari nomor dada atau nama").fill("")
  await expect(page.locator(BARIS)).toHaveCount(110)

  await page.getByRole("button", { name: "Belum disentuh" }).click()
  const belumDisentuh = await page.locator(BARIS).count()
  expect(belumDisentuh).toBeLessThanOrEqual(110)
  await expect(page.locator(`${BARIS}[data-berubah="ya"]`)).toHaveCount(0)
})

test("Simpan Semua mengirim satu kali dan menunggu konfirmasi server", async ({ page }) => {
  let jumlahPermintaan = 0
  page.on("request", (r) => {
    if (r.url().includes("/rpc/simpan_penilaian")) jumlahPermintaan += 1
  })

  await page.getByRole("button", { name: "Tambah nilai PK-003" }).click()
  await expect(page.locator(INDIKATOR)).toContainText("belum tersimpan")

  await page.locator('[data-uji="simpan-semua"]').click()

  await expect(page.locator(INDIKATOR)).toHaveText("Semua tersimpan")
  await expect(page.locator(`${BARIS}[data-tersimpan="tidak"]`)).toHaveCount(0)

  // 110 baris, satu permintaan
  expect(jumlahPermintaan).toBe(1)
})

test("nilai bertahan setelah muat ulang", async ({ page }) => {
  await page.locator(`${BARIS}[data-nomor="PK-004"] [data-uji="nilai"]`).click()
  await page.getByRole("button", { name: "9", exact: true }).click()
  await page.getByRole("button", { name: "3", exact: true }).click()
  await page.getByRole("button", { name: "Selesai" }).click()

  await page.locator('[data-uji="simpan-semua"]').click()
  await expect(page.locator(INDIKATOR)).toHaveText("Semua tersimpan")

  await page.reload()
  await expect(
    page.locator(`${BARIS}[data-nomor="PK-004"] [data-uji="nilai"]`),
  ).toHaveText("93")
})
