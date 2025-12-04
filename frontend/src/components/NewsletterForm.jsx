import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const API_BASE = import.meta.env.VITE_API_BASE || '/api';

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đăng ký thất bại');

      setStatus({ type: 'success', message: data.message });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="Email của bạn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg bg-slate-800/70 px-4 py-2 outline-none"
        />
        <button className="rounded-lg bg-white text-slate-900 px-4 py-2 font-medium">
          Đăng ký
        </button>
      </form>
      {status.message && (
        <p className={`mt-2 text-sm ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}
