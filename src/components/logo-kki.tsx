import fs from "node:fs"
import path from "node:path"

import Image from "next/image"

const BERKAS_LOGO = "logo-kki.png"

// Dicek sekali saat modul dimuat. Begitu berkasnya ditaruh di public/,
// lambang asli langsung dipakai tanpa mengubah kode.
const adaLogo = fs.existsSync(path.join(process.cwd(), "public", BERKAS_LOGO))

export function LogoKKI({ ukuran = 36 }: { ukuran?: number }) {
  if (adaLogo) {
    return (
      <Image
        src={`/${BERKAS_LOGO}`}
        alt="Lambang KKI"
        width={ukuran}
        height={ukuran}
        priority
        className="shrink-0 object-contain"
      />
    )
  }

  // Penanda sementara: lingkaran merah-putih seperti inti lambang.
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full border-2 border-foreground bg-background"
      style={{ width: ukuran, height: ukuran }}
    >
      <span
        className="block rounded-full bg-merek"
        style={{ width: ukuran * 0.44, height: ukuran * 0.44 }}
      />
    </span>
  )
}
