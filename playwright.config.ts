import { defineConfig } from "@playwright/test"

const PORT = process.env.PORT_UJI ?? "3000"
const ALAMAT = `http://localhost:${PORT}`

/** Viewport tablet landscape — satu-satunya bentuk layar yang dipakai penguji. */
const TABLET = { width: 1180, height: 820 }

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: ALAMAT,
    viewport: TABLET,
    hasTouch: true,
  },
  projects: [
    { name: "bersihkan", testMatch: /reset\.setup\.ts/ },
    { name: "masuk", testMatch: /auth\.setup\.ts/, dependencies: ["bersihkan"] },
    {
      name: "tablet",
      dependencies: ["masuk"],
      testIgnore: /\.setup\.ts/,
      use: { storageState: "e2e/.auth/penguji.json", viewport: TABLET, hasTouch: true },
    },
  ],
  // Memakai server dev yang sudah jalan kalau ada — Next 16 menolak
  // menjalankan dua dev server untuk direktori yang sama.
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: `${ALAMAT}/masuk`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
