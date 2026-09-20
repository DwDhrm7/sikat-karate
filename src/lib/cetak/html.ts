/**
 * Template cetak menyusun HTML sebagai teks, bukan lewat React: Next
 * melarang react-dom/server di runtime App Router, dan jalur cetak memang
 * tidak butuh React sama sekali.
 *
 * Konsekuensinya escaping jadi tanggung jawab kita. Setiap nilai yang
 * berasal dari data — nama peserta, nama dojo, alasan apa pun — WAJIB
 * lewat esc(). Nama dengan tanda kutip atau kurung siku bukan hal aneh,
 * dan satu saja yang lolos akan merusak seluruh tata letak halaman.
 */
export function esc(nilai: unknown): string {
  return String(nilai ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
