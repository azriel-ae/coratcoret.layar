// api/v1/sales.js
// Endpoint: https://coratcoretlayar.vercel.app/api/v1/sales
//
// POST  -> menyimpan 1 pesanan baru (dipanggil dari checkoutToWhatsApp() di website utama)
// GET   -> mengambil daftar pesanan (dipanggil dari website kedua / dashboard)
// DELETE-> mengosongkan semua data (opsional, untuk reset)
//
// Penyimpanan pakai Vercel BLOB: semua data disimpan sebagai 1 file JSON
// (sales-data.json) yang dibaca, diupdate, lalu diupload ulang setiap kali
// ada perubahan. Cocok untuk volume transaksi kecil-menengah.

const { put, list, del } = require('@vercel/blob');

const BLOB_KEY = 'sales-data.json';
const MAX_STORED = 500; // batasi jumlah record yang disimpan agar file tidak membengkak

function setCors(res) {
  // Ganti '*' dengan domain website kedua kamu jika ingin membatasi akses.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Pastikan browser/CDN/proxy TIDAK pernah cache respons endpoint ini,
  // supaya data penjualan selalu real-time dan tidak ketinggalan (mencegah 304 palsu).
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

// Cari URL blob sales-data.json yang sudah ada (kalau ada)
async function findExistingBlob() {
  const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
  return blobs.find((b) => b.pathname === BLOB_KEY) || null;
}

async function readSales() {
  const existing = await findExistingBlob();
  if (!existing) return [];

  try {
    // Cache-busting: tambahkan query unik supaya CDN Vercel Blob tidak pernah
    // mengembalikan versi lama yang ter-cache (Vercel Blob CDN cache bisa
    // menyimpan konten lama sampai beberapa saat meski sudah di-overwrite).
    const bustUrl = `${existing.url}?_t=${Date.now()}`;
    const res = await fetch(bustUrl, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Gagal membaca blob sales-data.json:', err);
    return [];
  }
}

async function writeSales(sales) {
  await put(BLOB_KEY, JSON.stringify(sales), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false, // supaya nama file & URL tetap sama setiap update
    allowOverwrite: true, // wajib true karena kita menimpa file yang sama tiap kali
    cacheControlMaxAge: 60, // minimum yang diizinkan Vercel, perkecil jendela cache basi
  });
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ---------- POST: simpan pesanan baru ----------
  if (req.method === 'POST') {
    try {
      const order = req.body;

      if (!order || typeof order !== 'object') {
        return res.status(400).json({ success: false, error: 'Data pesanan tidak valid' });
      }

      // "id" TIDAK wajib dikirim dari website checkout — kalau kosong,
      // server yang membuatkan ID unik sendiri. Ini penting karena banyak
      // kode checkout (termasuk contoh payload di dashboard) tidak
      // menyertakan id sama sekali; sebelumnya request seperti ini malah
      // ditolak (400) sehingga transaksi asli tidak pernah tersimpan.
      const generatedId = 'TX-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();

      const record = {
        id: order.id || generatedId,
        invoice: order.invoice || order.id || generatedId,
        customer: order.customer || 'Pelanggan WhatsApp',
        product: order.product || '',
        qty: Number(order.qty) || 0,
        total: Number(order.total) || 0,
        payment_method: order.payment_method || 'WhatsApp Order',
        status: order.status || 'Completed',
        date: order.date || new Date().toISOString(),
      };

      const sales = await readSales();
      sales.unshift(record);
      const trimmed = sales.slice(0, MAX_STORED);

      await writeSales(trimmed);

      return res.status(201).json({ success: true, order: record });
    } catch (err) {
      console.error('POST /api/v1/sales error:', err);
      return res.status(500).json({ success: false, error: 'Gagal menyimpan data penjualan' });
    }
  }

  // ---------- GET: ambil daftar pesanan (dipakai website kedua) ----------
  if (req.method === 'GET') {
    try {
      const limit = Math.min(Number(req.query.limit) || 100, MAX_STORED);
      const sales = await readSales();

      return res.status(200).json({ success: true, count: Math.min(sales.length, limit), sales: sales.slice(0, limit) });
    } catch (err) {
      console.error('GET /api/v1/sales error:', err);
      return res.status(500).json({ success: false, error: 'Gagal mengambil data penjualan' });
    }
  }

  // ---------- PUT: perbarui transaksi yang sudah ada (edit nominal, status, dst) ----------
  if (req.method === 'PUT') {
    try {
      const body = req.body;

      if (!body || typeof body !== 'object') {
        return res.status(400).json({ success: false, error: 'Data update tidak valid' });
      }

      const targetKey = (body.id || body.invoice || '').toString();
      if (!targetKey) {
        return res.status(400).json({ success: false, error: 'id atau invoice wajib diisi untuk update' });
      }

      const sales = await readSales();
      const idx = sales.findIndex((s) => (s.id || '').toString() === targetKey || (s.invoice || '').toString() === targetKey);

      // Field yang boleh diubah lewat edit di dashboard
      const allowedFields = ['total', 'amount', 'payment_method', 'status', 'customer', 'product', 'qty'];

      if (idx === -1) {
        // Belum ada di server (misalnya transaksi lama yang cuma tersimpan lokal) -> buat baru
        const record = {
          id: body.id || targetKey,
          invoice: body.invoice || targetKey,
          customer: body.customer || 'Pelanggan WhatsApp',
          product: body.product || '',
          qty: Number(body.qty) || 0,
          total: Number(body.total) || 0,
          payment_method: body.payment_method || 'QRIS',
          status: body.status || 'Pending',
          date: body.date || new Date().toISOString(),
        };
        sales.unshift(record);
        await writeSales(sales.slice(0, MAX_STORED));
        return res.status(201).json({ success: true, order: record });
      }

      const updated = { ...sales[idx] };
      allowedFields.forEach((field) => {
        if (typeof body[field] !== 'undefined') {
          updated[field] = (field === 'total' || field === 'amount' || field === 'qty') ? Number(body[field]) : body[field];
        }
      });
      updated.updated_at = new Date().toISOString();
      sales[idx] = updated;

      await writeSales(sales);

      return res.status(200).json({ success: true, order: updated });
    } catch (err) {
      console.error('PUT /api/v1/sales error:', err);
      return res.status(500).json({ success: false, error: 'Gagal memperbarui data penjualan' });
    }
  }

  // ---------- DELETE: hapus 1 transaksi (pakai ?id=...), atau kosongkan semua kalau tanpa id ----------
  if (req.method === 'DELETE') {
    try {
      const targetKey = (req.query.id || '').toString();

      if (targetKey) {
        const sales = await readSales();
        const filtered = sales.filter((s) => (s.id || '').toString() !== targetKey && (s.invoice || '').toString() !== targetKey);

        if (filtered.length === sales.length) {
          return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
        }

        await writeSales(filtered);
        return res.status(200).json({ success: true, message: `Transaksi ${targetKey} dihapus` });
      }

      // Tanpa id -> reset seluruh data (dipakai tombol reset dashboard)
      const existing = await findExistingBlob();
      if (existing) {
        await del(existing.url);
      }
      return res.status(200).json({ success: true, message: 'Semua data penjualan dihapus' });
    } catch (err) {
      console.error('DELETE /api/v1/sales error:', err);
      return res.status(500).json({ success: false, error: 'Gagal menghapus data' });
    }
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
  return res.status(405).json({ success: false, error: 'Method tidak diizinkan' });
};
