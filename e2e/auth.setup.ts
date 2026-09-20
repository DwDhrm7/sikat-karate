import { expect, test as setup } from "@playwright/test"

const BERKAS_SESI = "e2e/.auth/penguji.json"

/**
 * Login lewat formulir sungguhan, bukan lewat penyuntikan cookie. Dengan
 * begitu Server Action masuk ikut teruji di sini.
 */
setup("penguji bisa masuk lewat formulir", async ({ page }) => {
  await page.goto("/masuk")

  await expect(page.getByLabel("Email")).toBeVisible()

  await page.getByLabel("Email").fill("penguji1@sikat.test")
  await page.getByLabel("Kata sandi").fill("sikat123")
  await page.getByRole("button", { name: "Masuk" }).click()

  // Peran penguji harus mendarat di halaman penilaian, bukan di tempat lain.
  await page.waitForURL("**/penguji**")
  await expect(page.getByRole("heading", { name: /Putih ke Kuning/ })).toBeVisible()

  await page.context().storageState({ path: BERKAS_SESI })
})

setup("kata sandi salah ditolak tanpa membocorkan apa pun", async ({ page }) => {
  await page.goto("/masuk")

  await page.getByLabel("Email").fill("penguji1@sikat.test")
  await page.getByLabel("Kata sandi").fill("sandi-yang-salah")
  await page.getByRole("button", { name: "Masuk" }).click()

  await expect(page.getByRole("alert").first()).toContainText("Email atau kata sandi salah")
  await expect(page).toHaveURL(/\/masuk/)
})
