import { 
  FaSearch, FaBars, FaTimes, FaBuilding, FaChevronDown, FaChevronRight, 
  FaUser, FaSignInAlt, FaUserPlus, FaHome, FaTags, FaRobot, FaBook, FaQuestionCircle, FaSignOutAlt 
} from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { signOutStart, signOutSuccess, signOutFailure } from '../redux/userSlice';

export default function Header() {
  const { currentUser } = useSelector((s) => s.user);
  const user = currentUser?.rest ?? currentUser ?? null;
  const dispatch = useDispatch();

  const [searchTerm, setSearchTerm] = useState('');
  const [openExplore, setOpenExplore] = useState(false); 
  const [openUserMenu, setOpenUserMenu] = useState(false); 
  const [openDrawer, setOpenDrawer] = useState(false);   

  const navigate = useNavigate();
  const location = useLocation();
  
  const exploreRef = useRef(null);
  const userMenuRef = useRef(null);

  const isActive = (path) =>
    location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path));

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    setSearchTerm(urlParams.get('searchTerm') || '');
  }, [location.search]);

  useEffect(() => {
    function onClickOutside(e) {
      if (exploreRef.current && !exploreRef.current.contains(e.target)) {
        setOpenExplore(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setOpenUserMenu(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('searchTerm', searchTerm || '');
    navigate(`/search?${urlParams.toString()}`);
    setOpenDrawer(false);
  };

  // --- HÀM ĐĂNG XUẤT ---
  const handleSignOut = async () => {
    try {
      dispatch(signOutStart());
      const res = await fetch('/api/auth/signout', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(signOutFailure(data.message));
        return;
      }
      dispatch(signOutSuccess());
      setOpenUserMenu(false);
      setOpenDrawer(false);
      navigate('/signin');
    } catch (error) {
      dispatch(signOutFailure(error.message));
    }
  };

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors duration-200 ${
        isActive(to) ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
    </Link>
  );

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* --- 1. LOGO --- */}
          <Link to="/" className="flex items-center gap-2 group relative z-50" onClick={() => setOpenDrawer(false)}>
            <div className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
              <FaBuilding size={20} />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">
              PP<span className="text-emerald-600">House</span>
            </h1>
          </Link>

          {/* --- 2. SEARCH BAR (Desktop Only) --- */}
          <form
            onSubmit={handleSubmit}
            className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2.5 w-1/3 transition-all focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white focus-within:shadow-sm border border-transparent focus-within:border-emerald-200"
          >
            <input
              type="text"
              placeholder="Tìm nhà, căn hộ, khu vực..."
              className="bg-transparent focus:outline-none w-full text-sm text-slate-700 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" aria-label="Tìm kiếm" className="text-slate-400 hover:text-emerald-600 transition">
              <FaSearch />
            </button>
          </form>

          {/* --- 3. DESKTOP NAV --- */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/">Trang chủ</NavLink>
            
            {/* Dropdown Khám phá */}
            <div className="relative" ref={exploreRef}>
              <button
                onClick={() => setOpenExplore(!openExplore)}
                className={`flex items-center gap-1 text-sm font-medium transition ${
                  openExplore ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Khám phá <FaChevronDown size={10} className={`transition-transform ${openExplore ? 'rotate-180' : ''}`} />
              </button>
              
              {openExplore && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-2 animate-fadeIn">
                   {[
                    { path: '/search', label: 'Tìm kiếm nâng cao' },
                    { path: '/pricing', label: 'Bảng giá dịch vụ' },
                    { path: '/dudoan', label: 'Công cụ định giá AI' },
                    { path: '/guide', label: 'Hướng dẫn đăng tin' },
                    { path: '/faq', label: 'Hỏi đáp (FAQ)' },
                  ].map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setOpenExplore(false)}
                      className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/create-listing"
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition shadow-lg shadow-slate-900/10"
            >
              Đăng tin mới
            </Link>

            {/* User Dropdown */}
            <div className="relative ml-2" ref={userMenuRef}>
              {user ? (
                <div>
                  <button
                    onClick={() => setOpenUserMenu(!openUserMenu)}
                    className="flex items-center gap-2 border border-slate-200 rounded-full pl-1 pr-3 py-1 hover:shadow-md transition bg-white"
                  >
                    <img
                      className="rounded-full h-8 w-8 object-cover border border-slate-100"
                      src={user.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      alt="avatar"
                    />
                    <FaBars size={14} className="text-slate-500" />
                  </button>

                  {openUserMenu && (
                    <div className="absolute top-full right-0 mt-3 w-60 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-2 animate-fadeIn">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.username}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setOpenUserMenu(false)} className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                        Quản lý tài khoản
                      </Link>
                      {user.isAdmin && (
                        <Link to="/admin/dashboard" onClick={() => setOpenUserMenu(false)} className="block px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 font-medium">
                          Trang quản trị viên
                        </Link>
                      )}
                      
                      {/* Nút Đăng xuất cho Desktop */}
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button 
                          onClick={handleSignOut} 
                          className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Link to="/signin" className="text-slate-700 hover:text-emerald-600 px-3 py-2">Đăng nhập</Link>
                  <Link to="/signup" className="text-slate-700 hover:text-emerald-600 px-3 py-2">Đăng ký</Link>
                </div>
              )}
            </div>
          </div>

          {/* --- 4. MOBILE HAMBURGER --- */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpenDrawer(true)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition focus:outline-none active:scale-95"
            >
              <FaBars size={24} />
            </button>
          </div>

        </div>
      </div>

      {/* ================= MOBILE DRAWER ================= */}
      <div className={`md:hidden fixed inset-0 z-[100] ${openDrawer ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        
        <div 
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${openDrawer ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpenDrawer(false)}
        />
        
        <div className={`absolute top-0 right-0 w-[85%] max-w-[340px] h-[100dvh] bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${openDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* 1. Header của Drawer */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
            <h2 className="font-bold text-lg text-slate-800">Menu</h2>
            <button onClick={() => setOpenDrawer(false)} className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
              <FaTimes size={22} />
            </button>
          </div>

          {/* 2. Nội dung cuộn */}
          <div className="flex-1 overflow-y-auto bg-slate-50">
            
            {/* User Info Card */}
            <div className="p-5 bg-white mb-2 shadow-sm">
              {user ? (
                <div className="flex items-center gap-4">
                  <img 
                    src={user.avatar} 
                    alt="avt" 
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-100 shadow-sm" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-lg truncate">{user.username}</p>
                    <p className="text-xs text-slate-500 truncate mb-1">{user.email}</p>
                    <Link 
                      to="/profile" 
                      onClick={() => setOpenDrawer(false)} 
                      className="text-sm text-emerald-600 font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Quản lý tài khoản <FaChevronRight size={10} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-slate-500 text-sm mb-3">Chào mừng đến với PPHouse!</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link 
                      to="/signin" 
                      onClick={() => setOpenDrawer(false)} 
                      className="flex items-center justify-center gap-2 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition"
                    >
                      <FaSignInAlt /> Đăng nhập
                    </Link>
                    <Link 
                      to="/signup" 
                      onClick={() => setOpenDrawer(false)} 
                      className="flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:opacity-90 active:scale-95 transition"
                    >
                      <FaUserPlus /> Đăng ký
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Search Mobile */}
            <div className="px-5 py-2 bg-white mb-2 shadow-sm">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm bất động sản..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute left-3.5 top-3.5 text-slate-400" />
              </form>
            </div>

            {/* Menu Links */}
            <div className="px-5 py-4 bg-white shadow-sm space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Khám phá</p>
              <MobileLink to="/" onClick={() => setOpenDrawer(false)} active={isActive('/')} icon={<FaHome />}>Trang chủ</MobileLink>
              <MobileLink to="/search" onClick={() => setOpenDrawer(false)} active={isActive('/search')} icon={<FaSearch />}>Tìm kiếm</MobileLink>
              <MobileLink to="/pricing" onClick={() => setOpenDrawer(false)} active={isActive('/pricing')} icon={<FaTags />}>Bảng giá dịch vụ</MobileLink>
              <MobileLink to="/dudoan" onClick={() => setOpenDrawer(false)} active={isActive('/dudoan')} icon={<FaRobot />}>Định giá AI</MobileLink>
              <MobileLink to="/guide" onClick={() => setOpenDrawer(false)} active={isActive('/guide')} icon={<FaBook />}>Hướng dẫn</MobileLink>
              <MobileLink to="/faq" onClick={() => setOpenDrawer(false)} active={isActive('/faq')} icon={<FaQuestionCircle />}>Hỏi đáp</MobileLink>
              
              {/* Nút Đăng xuất cho Mobile */}
              {user && (
                 <button 
                   onClick={handleSignOut}
                   className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all text-red-600 hover:bg-red-50"
                 >
                    <span className="text-lg"><FaSignOutAlt /></span>
                    Đăng xuất
                 </button>
              )}
            </div>

            {user?.isAdmin && (
              <div className="mt-2 px-5 py-4 bg-white shadow-sm">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quản trị</p>
                 <MobileLink to="/admin/users" onClick={() => setOpenDrawer(false)} icon={<FaUser />}>Dashboard Admin</MobileLink>
              </div>
            )}
            
            <div className="h-24"></div>
          </div>

          {/* 3. Footer Fixed Button */}
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 safe-area-pb">
            <Link 
              to="/create-listing" 
              onClick={() => setOpenDrawer(false)}
              className="flex items-center justify-center w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-base shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              + Đăng tin mới
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}

function MobileLink({ to, children, onClick, active, icon }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
        active 
          ? 'bg-emerald-50 text-emerald-700' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={`text-lg ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
        {icon}
      </span>
      {children}
    </Link>
  );
}