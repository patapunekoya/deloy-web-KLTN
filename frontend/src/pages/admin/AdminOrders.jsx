// src/pages/admin/AdminOrders.jsx
import { useEffect, useState } from 'react';

export default function AdminOrders() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const fetchOrders = async (p = 1) => {
    try {
      setLoading(true);
      setErr('');
      const res = await fetch(
        `/api/credits/admin/orders?search=${encodeURIComponent(
          q
        )}&page=${p}&limit=${limit}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
      setPage(data.page || 1);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e.message || 'Lỗi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages = Math.ceil(total / limit) || 1;

  const formatMoney = (v) =>
    (v || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  const renderStatus = (o) => {
    const s = o.status;
    const payStatus = o.payosStatus;

    let label = '';
    let cls = '';

    if (s === 'paid') {
      label = 'Đã thanh toán';
      cls =
        'bg-emerald-50 text-emerald-700 border border-emerald-200';
    } else if (s === 'cancelled') {
      label = 'Đã huỷ';
      cls = 'bg-red-50 text-red-700 border border-red-200';
    } else {
      label = 'Đang chờ';
      cls = 'bg-amber-50 text-amber-700 border border-amber-200';
    }

    return (
      <div className="flex flex-col gap-0.5">
        <span
          className={
            'inline-flex px-2 py-0.5 rounded-full text-xs ' + cls
          }
        >
          {label}
        </span>
        {o.paymentMethod === 'payos' && payStatus && (
          <span className="text-[10px] text-slate-500">
            PayOS: {payStatus}
          </span>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          className="border p-2 rounded flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo mã đơn / tên / email..."
        />
        <button
          onClick={() => fetchOrders(1)}
          className="px-3 py-2 rounded bg-slate-900 text-white"
        >
          Tìm
        </button>
      </div>

      {err && <div className="mb-3 text-red-600">{err}</div>}
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-3 py-2 text-left">Mã đơn</th>
                <th className="px-3 py-2 text-left">Người mua</th>
                <th className="px-3 py-2 text-left">Gói</th>
                <th className="px-3 py-2 text-right">Tổng tiền</th>
                <th className="px-3 py-2 text-left">Trạng thái</th>
                <th className="px-3 py-2 text-left">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => {
                const firstItem = o.items?.[0];
                const label =
                  o.items?.length > 1
                    ? `${firstItem?.label} (+${o.items.length - 1} gói)`
                    : firstItem?.label || '—';

                return (
                  <tr key={o._id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">
                      {o._id}
                    </td>
                    <td className="px-3 py-2">
                      {o.user ? (
                        <>
                          <div className="font-medium">
                            {o.user.username}
                          </div>
                          <div className="text-xs text-slate-500">
                            {o.user.email}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">
                          (đã xoá user)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs">{label}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatMoney(o.totalAmount)}
                    </td>
                    <td className="px-3 py-2">{renderStatus(o)}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleString('vi-VN')
                        : ''}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => fetchOrders(page - 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          Trước
        </button>
        <span>
          Trang {page}/{pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => fetchOrders(page + 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
