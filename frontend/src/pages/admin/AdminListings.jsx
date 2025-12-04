import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaSearch, 
  FaEye, 
  FaTrashAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock,
  FaMapMarkerAlt
} from 'react-icons/fa';

// Helper: Format giá
function formatPriceVnd(value) {
  if (value === null || value === undefined || value === '') return 'Liên hệ';
  if (typeof value === 'number') {
    return value.toLocaleString('vi-VN') + ' đ';
  }
  return value;
}

export default function AdminListings() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10; // 10 tin mỗi trang cho bảng
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const fetchListings = async (p = 1) => {
    try {
      setLoading(true);
      setErr('');

      const params = new URLSearchParams();
      params.set('page', p);
      params.set('limit', limit);
      if (q.trim()) params.set('search', q.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/listings?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setItems(data.items || []);
      setPage(data.page || p);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e.message || 'Không tải được danh sách listing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const removeListing = async (id) => {
    if (!confirm('CẢNH BÁO: Xoá bài đăng này sẽ mất vĩnh viễn. Bạn có chắc chắn?')) return;
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        fetchListings(page);
      } else {
        alert('Xoá thất bại');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const pages = Math.ceil(total / limit) || 1;

  const statusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'rejected', label: 'Bị từ chối' },
  ];

  const renderStatusBadge = (status) => {
    const configs = {
      approved: { 
        label: 'Đã duyệt', 
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: <FaCheckCircle className="mr-1"/> 
      },
      pending: { 
        label: 'Chờ duyệt', 
        className: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: <FaClock className="mr-1"/>
      },
      rejected: { 
        label: 'Bị từ chối', 
        className: 'bg-red-100 text-red-700 border-red-200',
        icon: <FaTimesCircle className="mr-1"/>
      },
    };

    const config = configs[status] || configs.approved;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${config.className}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* === HEADER & TOOLBAR === */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          {/* Tabs Filter */}
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  statusFilter === opt.value
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề..."
              onKeyDown={(e) => e.key === 'Enter' && fetchListings(1)}
            />
            <FaSearch className="absolute left-3.5 top-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* === ERROR MESSAGE === */}
      {err && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
          ⚠️ {err}
        </div>
      )}

      {/* === DATA TABLE === */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-5xl mb-3 opacity-20">📭</div>
            <p className="text-slate-500 font-medium">Không tìm thấy bài đăng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4 w-20">Ảnh</th>
                  <th className="px-6 py-4">Thông tin BĐS</th>
                  <th className="px-6 py-4">Giá & Diện tích</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((l) => {
                  // Logic giá
                  const contactFlag = !!l.priceContact;
                  const rawPrice = l.offer && !contactFlag && l.discountPrice ? l.discountPrice : l.regularPrice;
                  let priceLabel = contactFlag ? 'Liên hệ' : (l.priceDisplay || formatPriceVnd(rawPrice));
                  
                  const mainImage = l.imageUrls?.[0] || 'https://placehold.co/100x100?text=No+Image';

                  return (
                    <tr key={l._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 align-top">
                        <img
                          src={mainImage}
                          alt="thumb"
                          className="w-16 h-12 object-cover rounded-lg border border-slate-200"
                        />
                      </td>
                      <td className="px-6 py-4 align-top max-w-xs">
                        <div className="font-bold text-slate-800 line-clamp-1 mb-1" title={l.name}>
                          {l.name}
                        </div>
                        <div className="flex items-start gap-1 text-xs text-slate-500 mb-2">
                          <FaMapMarkerAlt className="mt-0.5 shrink-0" />
                          <span className="line-clamp-1" title={l.address}>{l.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           {/* Loại tin Badge */}
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              l.type === 'rent' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                           }`}>
                              {l.type === 'rent' ? 'Cho thuê' : 'Bán'}
                           </span>
                           <span className="text-[10px] text-slate-400">
                              {new Date(l.createdAt).toLocaleDateString('vi-VN')}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="font-bold text-emerald-700">{priceLabel}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {l.area ? `${l.area} m²` : '---'}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        {renderStatusBadge(l.status)}
                      </td>
                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex justify-end gap-3">
                          <Link
                            to={`/listing/${l._id}`}
                            target="_blank"
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Xem chi tiết trên web"
                          >
                            <FaEye size={16} />
                          </Link>
                          <button
                            onClick={() => removeListing(l._id)}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Xoá vĩnh viễn"
                          >
                            <FaTrashAlt size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === PAGINATION === */}
      {!loading && items.length > 0 && (
        <div className="mt-6 flex justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => fetchListings(page - 1)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Trước
          </button>
          <span className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 shadow-sm">
            Trang {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => fetchListings(page + 1)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}