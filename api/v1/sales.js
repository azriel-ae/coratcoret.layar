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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
    const res = await fetch(existing.url, { cache: 'no-store' });
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

      if (!order || typeof order !== 'object' || !order.id) {
        return res.status(400).json({ success: false, error: 'Data pesanan tidak valid' });
      }

      const record = {
        id: order.id,
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

  // ---------- DELETE: kosongkan semua data (opsional, untuk reset dashboard) ----------
  if (req.method === 'DELETE') {
    try {
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

  res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
  return res.status(405).json({ success: false, error: 'Method tidak diizinkan' });
};
