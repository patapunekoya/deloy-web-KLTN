import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaCheck, FaTimes, FaExternalLinkAlt, FaMapMarkerAlt } from 'react-icons/fa';

export default function AdminPendingListings() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const fetchListings = async (p = 1) => {
    try {
      setLoading(true);
      setErr('');

      const params = new URLSearchParams();
      params.set('page', p);
      params.set('limit', limit);
      params.set('status', 'pending');
      if (q.trim()) params.set('search', q.trim());

      const res = await fetch(`/api/admin/listings?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok || data?.success === false) {
        setErr(data?.message || 'Không lấy được danh sách tin chờ duyệt');
        setItems([]);
        setTotal(0);
        return;
      }

      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
    } catch (e) {
      setErr(e.message || 'Có lỗi xảy ra');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages = Math.max(1, Math.ceil(total / limit));

  const updateStatus = async (id, status) => {
    if (!confirm(`Bạn có chắc muốn ${status === 'approved' ? 'DUYỆT' : 'TỪ CHỐI'} tin này?`)) return;
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();

      if (!res.ok || data?.success === false) {
        setErr(data?.message || 'Không cập nhật được trạng thái');
        return;
      }

      // Remove khỏi danh sách sau khi xử lý
      setItems((prev) => prev.filter((item) => item._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (e) {
      setErr(e.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* Header & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
            Tin chờ duyệt ({total})
          </h2>
          
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchListings(1)}
              placeholder="Tìm kiếm tin đăng..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <FaSearch className="absolute left-3.5 top-2.5 text-slate-400" />
          </div>
        </div>
      </div>

      {err && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">
          {err}
        </div>
      )}

      {/* Content Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : items.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <p>Không có tin nào đang chờ duyệt</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3 w-20">Ảnh</th>
                  <th className="px-4 py-3">Thông tin tin đăng</th>
                  <th className="px-4 py-3 w-40 text-center">Loại tin</th>
                  <th className="px-4 py-3 w-48 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    {/* Cột Ảnh */}
                    <td className="px-4 py-3">
                      <img
                        src={item.imageUrls?.[0] || 'https://placehold.co/100x100'}
                        alt="img"
                        className="w-16 h-12 object-cover rounded-lg border border-slate-200"
                      />
                    </td>

                    {/* Cột Thông tin */}
                    <td className="px-4 py-3 max-w-md">
                      <Link
                        to={`/listing/${item._id}`}
                        target="_blank"
                        className="font-bold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-1 flex items-center gap-2"
                        title={item.name}
                      >
                        {item.name} <FaExternalLinkAlt size={10} className="text-slate-400" />
                      </Link>
                      
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <FaMapMarkerAlt className="shrink-0" />
                        <span className="truncate max-w-[250px]" title={item.address}>
                          {item.address}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-400 mt-1">
                        Đăng bởi: <span className="font-medium text-slate-600">{item.contactName || 'Ẩn danh'}</span> • {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>

                    {/* Cột Loại tin */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                        item.listingType === 'vip' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        item.listingType === 'premium' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {item.listingType || 'Thường'}
                      </span>
                    </td>

                    {/* Cột Hành động */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => updateStatus(item._id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all"
                          title="Duyệt tin này"
                        >
                          <FaCheck /> Duyệt
                        </button>
                        <button
                          onClick={() => updateStatus(item._id, 'rejected')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all"
                          title="Từ chối tin này"
                        >
                          <FaTimes /> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => fetchListings(page - 1)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800">
            Trang {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => fetchListings(page + 1)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}