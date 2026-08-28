// api/v1/sales.js
// Endpoint: https://coratcoretlayar.vercel.app/api/v1/sales
//
// POST  -> menyimpan 1 pesanan baru (dipanggil dari checkoutToWhatsApp() di website utama)
// GET   -> mengambil daftar pesanan (dipanggil dari website kedua / dashboard)
//
// Penyimpanan pakai Vercel KV (Redis) supaya data bisa diakses dari domain manapun,
// tidak seperti localStorage yang cuma tersimpan di browser masing-masing pengunjung.

const { kv } = require('@vercel/kv');

const SALES_KEY = 'ccl:sales';
const MAX_STORED = 500; // batasi jumlah record yang disimpan agar tidak membengkak

function setCors(res) {
  // Ganti '*' dengan domain website kedua kamu jika ingin membatasi akses,
  // misal: res.setHeader('Access-Control-Allow-Origin', 'https://dashboard-kamu.vercel.app');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

      await kv.lpush(SALES_KEY, JSON.stringify(record));
      await kv.ltrim(SALES_KEY, 0, MAX_STORED - 1);

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
      const raw = await kv.lrange(SALES_KEY, 0, limit - 1);
      const sales = raw.map((r) => (typeof r === 'string' ? JSON.parse(r) : r));

      return res.status(200).json({ success: true, count: sales.length, sales });
    } catch (err) {
      console.error('GET /api/v1/sales error:', err);
      return res.status(500).json({ success: false, error: 'Gagal mengambil data penjualan' });
    }
  }

  // ---------- DELETE: kosongkan semua data (opsional, untuk reset dashboard) ----------
  if (req.method === 'DELETE') {
    try {
      await kv.del(SALES_KEY);
      return res.status(200).json({ success: true, message: 'Semua data penjualan dihapus' });
    } catch (err) {
      console.error('DELETE /api/v1/sales error:', err);
      return res.status(500).json({ success: false, error: 'Gagal menghapus data' });
    }
  }

  res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
  return res.status(405).json({ success: false, error: 'Method tidak diizinkan' });
};
