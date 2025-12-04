// src/pages/UserProfile.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import ListingItem from '../components/ListingItem';

const PAGE_LIMIT = 9;

const UserProfile = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  // State stats để riêng, không bị ảnh hưởng bởi bộ lọc listing
  const [stats, setStats] = useState({ total: 0, totalSale: 0, totalRent: 0 });
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState('all'); 

  // 1. Sync URL params vào State
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pageFromUrl = Number(params.get('page')) || 1;
    const typeFromUrl = params.get('type') || 'all';

    setCurrentPage(pageFromUrl);
    setType(typeFromUrl);
  }, [location.search]);

  // 2. FETCH USER INFO & STATS (Chỉ chạy 1 lần khi userId thay đổi)
  // Mục đích: Lấy thông tin người bán và số liệu thống kê "Gốc" (không bị filter cắt bớt)
  useEffect(() => {
    const fetchUserAndStats = async () => {
      try {
        // Luôn gọi type=all và limit=1 để lấy stats đầy đủ
        const res = await fetch(`/api/listing/by-user/${userId}?type=all&limit=1`);
        const data = await res.json();

        if (res.ok && data.success !== false) {
          setUser(data.user);
          setStats(data.stats || { total: 0, totalSale: 0, totalRent: 0 });
        }
      } catch (e) {
        console.error("Lỗi tải thông tin người dùng:", e);
        setErr('Không tải được thông tin người bán');
      }
    };

    if (userId) fetchUserAndStats();
  }, [userId]);

  // 3. FETCH LISTINGS (Chạy mỗi khi page hoặc type thay đổi)
  // Mục đích: Chỉ lấy danh sách tin để hiển thị
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        // Không reset err ở đây để tránh mất thông báo lỗi user nếu có
        
        const params = new URLSearchParams();
        params.set('page', String(currentPage));
        params.set('limit', String(PAGE_LIMIT));
        params.set('type', type); // Filter theo type người dùng chọn

        const res = await fetch(`/api/listing/by-user/${userId}?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || data?.success === false) {
          throw new Error(data?.message || `HTTP ${res.status}`);
        }

        // CHỈ CẬP NHẬT LISTINGS VÀ PAGINATION
        // KHÔNG cập nhật user/stats ở đây để tránh bị ghi đè sai lệch
        setListings(Array.isArray(data.items) ? data.items : []);
        setTotalPages(data.totalPages || 1);
        
      } catch (e) {
        console.error(e);
        setErr(e.message || 'Không tải được danh sách tin');
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (userId) fetchListings();
  }, [userId, currentPage, type]);

  const handleChangeType = (nextType) => {
    if (nextType === type) return;
    const params = new URLSearchParams(location.search);
    params.set('type', nextType);
    params.set('page', '1');
    navigate(`/user/${userId}?${params.toString()}`);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    const params = new URLSearchParams(location.search);
    params.set('page', String(page));
    params.set('type', type);
    navigate(`/user/${userId}?${params.toString()}`);
  };

  const buildPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
      return pages;
    }
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('left-ellipsis');
    for (let i = left; i <= right; i += 1) pages.push(i);
    if (right < totalPages - 1) pages.push('right-ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const joinedText = useMemo(() => {
    if (!user?.joinedAt) return '';
    const d = new Date(user.joinedAt);
    return `tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
  }, [user?.joinedAt]);

  return (
    <main className="max-w-6xl mx-auto px-3 md:px-4 py-5">
      {/* BREADCRUMB */}
      <div className="mb-4 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-emerald-600 hover:underline transition-colors">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span>Hồ sơ người bán</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,1fr)_minmax(0,2.5fr)] gap-6">
        {/* LEFT: THÔNG TIN NGƯỜI BÁN */}
        <aside>
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            {loading && !user && (
              <div className="animate-pulse space-y-4">
                <div className="h-16 w-16 bg-slate-200 rounded-full"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </div>
            )}

            {err && !user && (
              <p className="text-sm text-red-600 text-center">{err}</p>
            )}

            {user && (
              <>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="relative mb-3">
                    <div className="h-20 w-20 rounded-full border-2 border-emerald-100 p-1 bg-white">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white" title="Online"></span>
                  </div>
                  
                  <h1 className="text-xl font-bold text-slate-900 mb-1">
                    {user.name}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                    Thành viên từ {joinedText}
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  {user.phone && (
                    <div className="group">
                        <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Số điện thoại</p>
                        <a href={`tel:${user.phone}`} className="block w-full text-center py-2 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors">
                            {user.phone}
                        </a>
                    </div>
                  )}

                  {user.email && (
                    <div>
                       <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Email liên hệ</p>
                       <a href={`mailto:${user.email}`} className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition-colors break-all font-medium">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                          {user.email}
                       </a>
                    </div>
                  )}
                  
                  {user.zalo && (
                     <div>
                        <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Zalo</p>
                        <span className="flex items-center gap-2 text-slate-700 font-medium">
                           <span className="font-bold text-blue-600">Z</span> {user.zalo}
                        </span>
                     </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="block text-xs text-slate-500 mb-1">Tổng tin</span>
                    <span className="block text-lg font-bold text-slate-900">{stats.total}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="block text-xs text-slate-500 mb-1">Bán</span>
                    <span className="block text-lg font-bold text-emerald-600">{stats.totalSale}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="block text-xs text-slate-500 mb-1">Thuê</span>
                    <span className="block text-lg font-bold text-blue-600">{stats.totalRent}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* RIGHT: DANH SÁCH TIN */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="bg-emerald-600 w-1.5 h-6 rounded-full"></span>
              Danh sách tin đăng
            </h2>
            
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleChangeType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  type === 'all'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => handleChangeType('sale')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  type === 'sale'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Nhà bán
              </button>
              <button
                type="button"
                onClick={() => handleChangeType('rent')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  type === 'rent'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Nhà thuê
              </button>
            </div>
          </div>

          {loading && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                   <div key={i} className="h-[380px] bg-slate-100 rounded-2xl animate-pulse"></div>
                ))}
             </div>
          )}

          {!loading && listings.length === 0 && (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-500 font-medium">
                Chưa có tin đăng nào trong mục này.
              </p>
            </div>
          )}

          {/* GRID 3 CỘT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} />
            ))}
          </div>

          {/* PAGINATION */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <div className="inline-flex items-center gap-2 bg-white p-2 rounded-full border border-slate-100 shadow-sm">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                >
                  ‹
                </button>

                {buildPageNumbers().map((item, idx) => {
                  if (item === 'left-ellipsis' || item === 'right-ellipsis') {
                    return (
                      <span key={item + idx} className="px-2 text-slate-400 select-none text-xs">...</span>
                    );
                  }

                  const page = item;
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md scale-110'
                          : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default UserProfile;