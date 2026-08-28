# Setup API + Dashboard Penjualan (satu domain) — coratcoretlayar.vercel.app

## Isi paket ini
```
api/v1/sales.js                  → endpoint backend (GET/POST/DELETE)
package.json                     → dependency @vercel/blob
vercel.json                      → supaya /penjualan bisa diakses langsung
penjualan.html                   → dashboard rekap penjualan (dulu "website kedua")
checkout-integration-snippet.js  → contoh kode untuk tombol checkout di website utama
```

## Apa yang diperbaiki dari versi sebelumnya
1. **Bug utama: checkout asli ditolak server.** Sebelumnya `api/v1/sales.js`
   mewajibkan field `id` di setiap POST, padahal contoh payload checkout yang
   ditampilkan di dashboard sendiri tidak menyertakan `id`. Akibatnya request
   checkout asli kemungkinan besar selalu gagal (400) dan tidak pernah
   tersimpan. Sekarang `id` **opsional** — server otomatis membuatkan ID unik
   kalau tidak dikirim.
2. **Dashboard sekarang satu domain, bukan lintas domain.** `penjualan.html`
   dipasang di project Vercel yang sama dengan backend, jadi tidak perlu lagi
   mengetik domain lengkap — dashboard otomatis memanggil `/api/v1/sales`
   (path relatif) di domain manapun project ini di-deploy.
3. **Dashboard tidak lagi mencampur data karangan dengan data asli.** Dulu
   transaksi yang diinput manual lewat tombol "Transaksi Baru" hanya
   tersimpan di `localStorage` browser (jadi seolah "data asli" padahal
   bukan). Sekarang tombol itu benar-benar mengirim POST ke server, jadi
   semua transaksi yang tampil — baik dari checkout maupun input manual —
   adalah data yang sama, tersimpan terpusat di server.
4. **Auto-Sync aktif otomatis.** Dashboard langsung polling tiap 15 detik
   sejak dibuka (sebelumnya harus diklik manual), plus langsung refresh saat
   tab dashboard dibuka kembali.
5. Fetch selalu `no-store` + cache-busting, konsisten dengan cara backend
   membaca Blob Store, supaya tidak ada data basi ke-cache di browser/CDN.

## Langkah setup

1. **Pastikan Blob Store sudah terhubung ke project**
   `galeri-tkj1` (Blob Store) harus terhubung ke project `coratcoretlayar`
   (Storage → `galeri-tkj1` → tab **Projects** → connect). Ini otomatis
   menambahkan environment variable `BLOB_READ_WRITE_TOKEN`.

2. **Salin semua file di paket ini ke ROOT repo website utama Anda**
   (project Vercel yang sama dengan website checkout), lalu commit & push.
   - Kalau repo Anda sudah punya `package.json` sendiri, gabungkan dependency
     `@vercel/blob` ke situ (jangan menimpa file yang sudah ada).
   - Kalau repo Anda sudah punya `vercel.json`, gabungkan isi `rewrites` di
     file ini ke dalamnya (jangan menimpa configurasi lain yang sudah ada).

3. **Redeploy** project agar `BLOB_READ_WRITE_TOKEN` terbaca oleh function
   dan routing baru aktif.

4. **Tes endpoint & halaman**
   - `GET https://coratcoretlayar.vercel.app/api/v1/sales` → harus balas
     `{"success": true, "sales": []}` di awal (kosong).
   - Buka `https://coratcoretlayar.vercel.app/penjualan` → dashboard login
     muncul (username `admin`, password `123` — **segera ganti kredensial
     ini di kode `AuthService.login()` sebelum go-live**).

5. **Sambungkan tombol Checkout di website utama**
   Tempel kode dari `checkout-integration-snippet.js` ke dalam fungsi
   checkout yang sudah ada di website utama Anda (mis. `checkoutToWhatsApp()`).
   Begitu tombol Checkout/Bayar diklik → data terkirim ke `/api/v1/sales` →
   otomatis muncul di `/penjualan` dalam ≤15 detik tanpa refresh manual.

## Catatan
- **Race condition kecil**: kalau dua checkout terjadi dalam waktu hampir
  bersamaan (milidetik), ada kemungkinan kecil salah satu data tertimpa saat
  proses baca-tulis file JSON. Untuk toko dengan volume transaksi normal
  (bukan ribuan checkout/detik), ini bukan masalah nyata.
- Field `access: 'public'` di kode berarti file `sales-data.json` bisa
  diakses siapa saja yang tahu URL-nya (tapi URL-nya acak/tidak ditebak, dan
  endpoint `/api/v1/sales` tetap yang jadi pintu masuk/keluar data resmi).
- Kalau nanti volume transaksi jadi ramai dan butuh performa lebih baik /
  tanpa risiko race condition sama sekali, tinggal migrasi ke Redis/KV tanpa
  mengubah endpoint yang dipanggil dari website utama maupun `/penjualan`.
