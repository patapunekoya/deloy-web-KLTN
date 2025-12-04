import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  FaUsers,
  FaList,
  FaClipboardCheck,
  FaShoppingCart,
  FaTicketAlt,
  FaArrowLeft,
  FaChartPie
} from 'react-icons/fa';

export default function AdminLayout() {
  const { pathname } = useLocation();

  // Danh sách menu
  const navItems = [
    { path: '/admin/dashboard', label: 'Tổng quan', icon: <FaChartPie /> },
    { path: '/admin/users', label: 'Quản lý User', icon: <FaUsers /> },
    { path: '/admin/listings', label: 'Tất cả tin đăng', icon: <FaList /> },
    { path: '/admin/pending-listings', label: 'Duyệt tin', icon: <FaClipboardCheck /> },
    { path: '/admin/orders', label: 'Đơn hàng', icon: <FaShoppingCart /> },
    { path: '/admin/coupons', label: 'Mã giảm giá', icon: <FaTicketAlt /> },
  ];

  // Hàm tính style cho link active
  const getLinkClass = (path) => {
    const isActive = pathname.includes(path);
    
    return `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium whitespace-nowrap ${
      isActive
        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 translate-x-1'
        : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200'
    }`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 font-sans">
      
      {/* --- Header Khu vực Admin --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <FaChartPie size={24} />
            </span>
            Dashboard Quản trị
          </h1>
          <p className="text-slate-500 text-sm mt-2 ml-1">
            Xin chào Admin, chúc bạn một ngày làm việc hiệu quả.
          </p>
        </div>
        
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white hover:text-emerald-600 hover:border-emerald-200 transition-all bg-slate-50"
        >
          <FaArrowLeft /> Về trang chủ
        </Link>
      </div>

      {/* --- Layout Chính: Grid 2 cột --- */}
      {/* FIX: Thêm gap lớn hơn và min-width cho sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start relative">
        
        {/* 1. Sidebar Navigation */}
        <aside className="
          z-10
          /* Mobile */
          w-full overflow-x-auto pb-2
          
          /* Desktop: Sticky + Fixed Size + Card Style */
          lg:w-auto lg:pb-0
          lg:sticky lg:top-24
          lg:min-w-[280px]  /* Quan trọng: Không cho co nhỏ */
          lg:shrink-0       /* Quan trọng: Không cho bị ép bởi content */
        ">
          {/* Đóng khung Sidebar thành 1 khối trắng để đồng bộ và nổi bật */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm lg:h-[calc(100vh-140px)] lg:overflow-y-auto scrollbar-hide">
             <div className="flex lg:flex-col gap-2 min-w-max lg:min-w-0">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={getLinkClass(item.path)}
                >
                  <span className="text-lg opacity-80">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* 2. Main Content (Outlet) */}
        <main className="w-full min-w-0 min-h-[600px] rounded-2xl border border-slate-200 bg-white p-5 md:p-8 shadow-sm">
          <Outlet />
        </main>

      </div>
    </div>
  );
}