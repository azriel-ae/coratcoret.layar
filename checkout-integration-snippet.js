/**
 * TEMPEL kode ini di WEBSITE UTAMA (website checkout), di dalam fungsi yang
 * dijalankan saat tombol Checkout/Bayar diklik — misalnya fungsi
 * `checkoutToWhatsApp()` yang sudah ada di website utama Anda.
 *
 * Karena website utama & dashboard (/penjualan) sekarang berada di SATU
 * domain Vercel yang sama, cukup panggil path RELATIF '/api/v1/sales' —
 * tidak perlu menuliskan domain lengkap dan tidak akan kena masalah CORS.
 *
 * Field "id" boleh dikosongkan (server akan membuatkan otomatis), tapi
 * kalau website utama sudah punya nomor invoice/ID transaksi sendiri,
 * sertakan saja supaya konsisten antara struk pelanggan & dashboard.
 */

async function kirimTransaksiKeDashboard(order) {
  try {
    const res = await fetch('/api/v1/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: order.id,                         // opsional
        customer: order.customer,             // nama pelanggan
        product: order.product,               // nama produk/layanan
        qty: order.qty,
        total: order.total,                   // total dalam Rupiah (angka)
        payment_method: order.payment_method, // contoh: 'QRIS', 'Transfer BCA'
        status: order.status || 'Completed',
      }),
    });

    const data = await res.json();
    if (!data.success) {
      console.error('Gagal mengirim transaksi ke dashboard:', data.error);
    }
    return data;
  } catch (err) {
    // Jangan sampai kegagalan pengiriman ke dashboard menghentikan proses
    // checkout pelanggan (misalnya redirect ke WhatsApp tetap harus jalan).
    console.error('Gagal mengirim transaksi ke dashboard:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Contoh pemakaian di dalam fungsi checkout yang sudah ada:
 *
 * function checkoutToWhatsApp() {
 *   const order = {
 *     customer: namaPelanggan,
 *     product: namaProduk,
 *     qty: jumlah,
 *     total: totalHarga,
 *     payment_method: metodeBayar,
 *   };
 *
 *   // Kirim data asli ke dashboard /penjualan (tidak perlu menunggu selesai
 *   // agar checkout pelanggan tetap cepat & tidak terganggu jika API lambat)
 *   kirimTransaksiKeDashboard(order);
 *
 *   // ... lanjutkan proses redirect ke WhatsApp seperti biasa ...
 * }
 */
