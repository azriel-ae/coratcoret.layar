/**
 * Contoh integrasi untuk WEBSITE KEDUA (dashboard penjualan).
 * Tempel/adaptasi kode ini ke file JS dashboard kamu.
 *
 * Karena ini lintas domain (website utama beda alamat dari dashboard),
 * localStorage & BroadcastChannel yang ada di website utama TIDAK akan
 * sampai ke sini secara langsung — makanya dashboard harus "menjemput"
 * data lewat API ini.
 */

const SALES_API = 'https://coratcoretlayar.vercel.app/api/v1/sales';

// Ambil semua data penjualan
async function fetchSales(limit = 100) {
  try {
    const res = await fetch(`${SALES_API}?limit=${limit}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Gagal mengambil data');
    return data.sales; // array of { id, customer, product, qty, total, payment_method, status, date }
  } catch (err) {
    console.error('Gagal fetch sales:', err);
    return [];
  }
}

// Render sederhana ke tabel dengan id="salesTableBody"
async function renderSalesTable() {
  const sales = await fetchSales();
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;

  tbody.innerHTML = sales
    .map(
      (s) => `
      <tr>
        <td>${s.id}</td>
        <td>${new Date(s.date).toLocaleString('id-ID')}</td>
        <td>${s.product}</td>
        <td>${s.qty}</td>
        <td>Rp ${Number(s.total).toLocaleString('id-ID')}</td>
        <td>${s.status}</td>
      </tr>
    `
    )
    .join('');
}

// Muat saat halaman dibuka
renderSalesTable();

// Polling otomatis tiap 15 detik supaya data selalu terbaru
setInterval(renderSalesTable, 15000);

// (Opsional) Hapus semua data lewat tombol reset dashboard
async function clearAllSales() {
  if (!confirm('Yakin ingin menghapus semua data penjualan?')) return;
  await fetch(SALES_API, { method: 'DELETE' });
  renderSalesTable();
}
