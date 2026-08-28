# Setup API Penjualan (versi Vercel Blob) — coratcoretlayar.vercel.app

## Apa yang berubah dari versi Redis/KV
- Tidak perlu bikin database baru. Kita pakai **Blob Store yang sudah ada** (`galeri-tkj1` di akun kamu).
- Semua data penjualan disimpan sebagai 1 file `sales-data.json` di dalam Blob Store tersebut. Setiap ada pesanan baru, file ini dibaca → ditambah data → diupload ulang.

## Langkah setup

1. **Pastikan Blob Store sudah terhubung ke project**
   Dari screenshot sebelumnya, `galeri-tkj1` (Blob Store) sudah ada di project `coratcoretlayar`. Kalau belum terhubung ke project ini secara spesifik, buka Storage → klik `galeri-tkj1` → tab **Projects** → connect ke project `coratcoretlayar`. Ini otomatis menambahkan environment variable `BLOB_READ_WRITE_TOKEN`.

2. **Tambahkan file ke project**
   Salin `api/v1/sales.js` dan `package.json` (gabung dependency `@vercel/blob` kalau project sudah punya `package.json` sendiri) ke root repo, lalu commit & push.

3. **Redeploy**
   Trigger deploy ulang supaya `BLOB_READ_WRITE_TOKEN` terbaca oleh function.

4. **Tes endpoint**
   - `GET https://coratcoretlayar.vercel.app/api/v1/sales` → harus balas `{"success": true, "sales": []}` di awal (kosong).
   - Coba checkout dari website utama → cek lagi endpoint GET, data pesanan harus muncul.
   - File `sales-data.json` juga akan terlihat di dashboard Blob Store kamu (Storage → galeri-tkj1 → Browse).

5. **Sambungkan ke website kedua**
   Pasang kode dari `dashboard-integration-example.js` di website kedua kamu — isinya sama persis seperti versi sebelumnya, tidak berubah, karena dia hanya `fetch` ke endpoint `/api/v1/sales`.

## Catatan
- **Race condition kecil**: kalau dua checkout terjadi dalam waktu hampir bersamaan (milidetik), ada kemungkinan kecil salah satu data tertimpa saat proses baca-tulis file JSON. Untuk toko dengan volume transaksi normal (bukan ribuan checkout/detik), ini bukan masalah nyata.
- Field `access: 'public'` di kode berarti file `sales-data.json` bisa diakses siapa saja yang tahu URL-nya (tapi URL-nya acak/tidak ditebak, dan endpoint utama tetap yang jadi pintu masuk/keluar data). Kalau butuh lebih privat, bisa saya bantu batasi lagi.
- Kalau nanti volume transaksi jadi ramai dan butuh performa lebih baik / tanpa risiko race condition sama sekali, tinggal bilang — saya bisa bantu migrasi balik ke Redis/KV kapan saja tanpa mengubah endpoint yang dipanggil dari website utama.
