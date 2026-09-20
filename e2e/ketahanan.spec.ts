import { expect, test } from "@playwright/test"

const BARIS = '[data-uji="baris"]'
const INDIKATOR = '[data-uji="indikator"]'

test.beforeEach(async ({ page }) => {
  await page.goto("/penguji")
  await expect(page.locator(BARIS).first()).toBeVisible()
})

test("perubahan yang belum terkirim bertahan setelah halaman dimuat ulang", async ({
  page,
}) => {
  const nomor = "PK-007"
  const sel = `${BARIS}[data-nomor="${nomor}"]`

  await page.getByRole("button", { name: `Tambah nilai ${nomor}` }).click()
  await page.getByRole("button", { name: `Tambah nilai ${nomor}` }).click()
  await expect(page.locator(`${sel} [data-uji="nilai"]`)).toHaveText("82")

  // sengaja TIDAK disimpan
  await page.reload()
  await expect(page.locator(BARIS).first()).toBeVisible()

  await expect(page.locator(`${sel} [data-uji="nilai"]`)).toHaveText("82")
  await expect(page.locator(sel)).toHaveAttribute("data-tersimpan", "tidak")
  await expect(page.locator(INDIKATOR)).toContainText("belum tersimpan")
})

test('sambungan putus: tidak pernah mengaku "tersimpan", lalu kirim ulang sendiri', async ({
  page,
  context,
}) => {
  const nomor = "PK-009"
  const sel = `${BARIS}[data-nomor="${nomor}"]`

  await page.getByRole("button", { name: `Tambah nilai ${nomor}` }).click()

  await context.setOffline(true)
  await page.locator('[data-uji="simpan-semua"]').click()

  // Inilah yang paling penting: kegagalan harus terlihat jujur.
  await expect(page.locator(INDIKATOR)).toContainText("Gagal terkirim")
  await expect(page.locator(INDIKATOR)).not.toContainText("Semua tersimpan")
  await expect(page.locator(sel)).toHaveAttribute("data-tersimpan", "tidak")

  // Nilainya sendiri tidak boleh hilang dari layar
  await expect(page.locator(`${sel} [data-uji="nilai"]`)).toHaveText("81")

  // Jaringan kembali: antrean terkirim sendiri tanpa penguji menekan apa pun
  await context.setOffline(false)

  await expect(page.locator(INDIKATOR)).toHaveText("Semua tersimpan", {
    timeout: 45_000,
  })
  await expect(page.locator(sel)).toHaveAttribute("data-tersimpan", "ya")
})

test("kegagalan server tidak menandai baris sebagai tersimpan", async ({ page }) => {
  const nomor = "PK-011"
  const sel = `${BARIS}[data-nomor="${nomor}"]`

  // Paksa server menjawab galat
  await page.route("**/rpc/simpan_penilaian", (rute) =>
    rute.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "server sedang bermasalah" }),
    }),
  )

  await page.getByRole("button", { name: `Tambah nilai ${nomor}` }).click()
  await page.locator('[data-uji="simpan-semua"]').click()

  await expect(page.locator(INDIKATOR)).toContainText("Gagal terkirim")
  await expect(page.locator(sel)).toHaveAttribute("data-tersimpan", "tidak")
})

test("baris di luar rentang penguji tidak pernah muncul", async ({ page }) => {
  // penguji1 hanya memegang 1-110
  await expect(page.locator(`${BARIS}[data-nomor="PK-111"]`)).toHaveCount(0)
  await expect(page.locator(`${BARIS}[data-nomor="PK-150"]`)).toHaveCount(0)

  await page.getByLabel("Cari nomor dada atau nama").fill("PK-1")
  const nomorTampil = await page.locator(BARIS).evaluateAll((baris) =>
    baris.map((b) => (b as HTMLElement).dataset.nomor ?? ""),
  )
  for (const n of nomorTampil) {
    const angka = Number(n.split("-")[1])
    expect(angka).toBeLessThanOrEqual(110)
  }
})
