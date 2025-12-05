// frontend/src/components/NewsletterForm.jsx
import { useState } from 'react';
import { toast } from 'react-hot-toast'; // Nhớ cài: npm install react-hot-toast

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // Gọi trực tiếp api (nhờ proxy/static serving)
      // Không cần biến môi trường phức tạp, tránh lỗi đường dẫn
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'Đăng ký thành công! Vui lòng kiểm tra email.');
        setEmail(''); // Xóa ô nhập
      } else {
        toast.error(data.message || 'Đăng ký thất bại.');
      }
    } catch (err) {
      console.error('Newsletter error:', err);
      toast.error('Lỗi kết nối server. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          placeholder="Nhập email của bạn..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all disabled:bg-slate-100"
          disabled={loading}
        />
        <button 
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-70 whitespace-nowrap"
        >
          {loading ? 'Đang gửi...' : 'Đăng ký ngay'}
        </button>
      </form>
      
      <p className="mt-3 text-xs text-slate-400 text-center sm:text-left">
        *Chúng tôi cam kết bảo mật thông tin và không spam.
      </p>
    </div>
  );
}