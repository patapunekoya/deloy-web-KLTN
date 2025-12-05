import { useState } from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaGithub, FaLinkedin, FaBuilding } from "react-icons/fa";

export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const API_BASE = import.meta.env.VITE_API_BASE || "/api";

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");
      setStatus({ type: "success", message: data.message || "Đăng ký thành công." });
      setEmail("");
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Có lỗi xảy ra." });
    }
  }

  return (
    <footer className="bg-slate-50 text-slate-600 border-t border-slate-200 pt-16 pb-8 text-sm font-medium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        
        {/* 1. Brand Info */}
        <div className="space-y-5">
          <Link to="/" className="flex items-center gap-2 group">
             <div className="bg-emerald-600 text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform shadow-md shadow-emerald-600/20">
               <FaBuilding size={18} />
             </div>
             <span className="font-bold text-xl tracking-tight text-slate-900">
               PP<span className="text-emerald-600">House</span>
             </span>
          </Link>
          <p className="text-slate-500 leading-relaxed font-normal pr-4">
            Nền tảng công nghệ bất động sản hàng đầu, kết nối người mua và người bán với trải nghiệm minh bạch, hiệu quả và tin cậy nhất.
          </p>
          <div className="flex items-center gap-4 pt-2">
            {[FaFacebook, FaInstagram, FaGithub, FaLinkedin].map((Icon, idx) => (
              <a 
                key={idx} 
                href="#" 
                target="_blank" 
                rel="noreferrer" 
                className="bg-white p-2.5 rounded-full border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-sm transition-all"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* 2. Quick Links */}
        <div>
          <h3 className="font-bold text-slate-900 text-base mb-5">Khám phá</h3>
          <ul className="space-y-3 text-slate-500">
            <li><Link to="/search" className="hover:text-emerald-600 hover:translate-x-1 inline-block transition-transform">Tìm kiếm nhà đất</Link></li>
            <li><Link to="/create-listing" className="hover:text-emerald-600 hover:translate-x-1 inline-block transition-transform">Đăng tin mới</Link></li>
            <li><Link to="/pricing" className="hover:text-emerald-600 hover:translate-x-1 inline-block transition-transform">Bảng giá dịch vụ</Link></li>
            <li><Link to="/dudoan" className="hover:text-emerald-600 hover:translate-x-1 inline-block transition-transform">Công cụ định giá AI</Link></li>
          </ul>
        </div>

        {/* 3. Support */}
        <div>
          <h3 className="font-bold text-slate-900 text-base mb-5">Hỗ trợ khách hàng</h3>
          <ul className="space-y-3 text-slate-500">
            <li><Link to="/about" className="hover:text-emerald-600 hover:translate-x-1 inline-block transition-transform">Về chúng tôi</Link></li>
            <li><Link to="/guide" className="hover:text-emerald-600 hover:translate-x-1 inline-block transition-transform">Hướng dẫn sử dụng</Link></li>
            <li><Link to="/faq" className="hover:text-emerald-600 hover:translate-x-1 inline-block transition-transform">Câu hỏi thường gặp</Link></li>
            <li className="pt-2">
                <span className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Hotline 24/7</span>
                <span className="font-bold text-lg text-slate-800 hover:text-emerald-600 cursor-pointer font-mono tracking-tight">0123 456 789</span>
            </li>
          </ul>
        </div>

        {/* 4. Newsletter */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
          <h3 className="font-bold text-slate-900 text-base mb-2">Đăng ký nhận tin</h3>
          <p className="text-slate-500 mb-4 text-xs font-normal">
            Nhận thông báo về trạng thái tin của bạn từ PPHouse.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-emerald-600/20 active:scale-[0.98]"
            >
              Đăng ký ngay
            </button>
          </form>
          {status.message && (
            <p className={`mt-3 text-xs font-semibold text-center ${status.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
              {status.message}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-200 pt-8 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col-reverse md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-xs text-center md:text-left font-normal">
            © {year} <span className="font-semibold text-slate-600">PPHouse Inc.</span> Bảo lưu mọi quyền.
          </p>
          <div className="flex gap-6 text-xs font-medium text-slate-500">
            <Link to="#" className="hover:text-emerald-600 transition-colors">Điều khoản sử dụng</Link>
            <Link to="#" className="hover:text-emerald-600 transition-colors">Chính sách bảo mật</Link>
            <Link to="#" className="hover:text-emerald-600 transition-colors">Chính sách Cookie</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}