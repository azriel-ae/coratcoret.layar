# Setup API Penjualan — coratcoretlayar.vercel.app

## Apa yang dibuat
- `api/v1/sales.js` — endpoint `POST /api/v1/sales` (simpan pesanan) dan `GET /api/v1/sales` (ambil daftar pesanan), disimpan pakai **Vercel KV**.
- `package.json` — menambahkan dependency `@vercel/kv`.
- `dashboard-integration-example.js` — contoh kode untuk website kedua supaya bisa menarik data dari API ini.

## Langkah setup (di Vercel Dashboard)

1. **Tambahkan file ke project yang sudah ada**
   Salin folder `api/v1/sales.js` dan `package.json` (gabungkan dependency-nya jika project kamu sudah punya `package.json`) ke root repo project `coratcoretlayar.vercel.app`, lalu push/deploy.

2. **Aktifkan Vercel KV**
   - Buka [vercel.com/dashboard](https://vercel.com/dashboard) → pilih project `coratcoretlayar`.
   - Masuk tab **Storage** → **Create Database** → pilih **KV** (berbasis Redis, ada free tier).
   - Setelah dibuat, klik **Connect Project** → hubungkan ke project `coratcoretlayar`.
   - Vercel otomatis menambahkan environment variable yang dibutuhkan (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, dll) — kamu tidak perlu isi manual.

3. **Redeploy project**
   Setelah KV terhubung, trigger deploy ulang (push commit baru, atau klik **Redeploy** di dashboard) supaya environment variable KV terbaca oleh function.

4. **Cek endpoint**
   - Test kirim data (contoh pakai browser console atau Postman):
     ```
     POST https://coratcoretlayar.vercel.app/api/v1/sales
     Content-Type: application/json

     { "id": "TEST-1", "product": "Kaos (1x)", "qty": 1, "total": 100000 }
     ```
   - Test ambil data:
     ```
     GET https://coratcoretlayar.vercel.app/api/v1/sales
     ```
     Harus mengembalikan `{ "success": true, "sales": [...] }`.

5. **Sambungkan ke website kedua**
   Website utama (`coratcoret_layar`) sudah otomatis POST ke endpoint ini setiap ada checkout (lihat fungsi `checkoutToWhatsApp` di `assets/js/script.js`).
   Di website kedua, pasang kode dari `dashboard-integration-example.js` — dia akan **GET** data dari endpoint ini secara berkala (polling 15 detik) sehingga penjualan dari website utama otomatis muncul di dashboard, walau berbeda domain/device.

## Catatan keamanan (opsional tapi disarankan)
Saat ini endpoint terbuka untuk siapa saja (`Access-Control-Allow-Origin: *`) supaya mudah dites. Untuk produksi, sebaiknya:
- Ganti `*` di `setCors()` pada `sales.js` dengan domain website kedua kamu saja.
- Tambahkan API key sederhana (header custom, dicek di server) supaya orang lain tidak bisa POST data sampah ke endpoint kamu.

Saya bisa bantu tambahkan API key kalau kamu mau.
