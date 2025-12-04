import { useEffect, useState } from 'react';

export default function AdminUsers(){
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const fetchUsers = async (p=1) => {
    try{
      setLoading(true); setErr('');
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&page=${p}&limit=${limit}`, { credentials:'include' });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
      setPage(data.page); setTotal(data.total);
    }catch(e){ setErr(e.message); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ fetchUsers(1); }, []);

  const toggleAdmin = async (id, isAdmin) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json' },
      credentials:'include',
      body: JSON.stringify({ isAdmin: !isAdmin })
    });
    if(res.ok) fetchUsers(page);
  };

  const removeUser = async (id) => {
    if(!confirm('Xoá user này? Bài đăng của họ cũng sẽ bị xoá.')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method:'DELETE', credentials:'include' });
    if(res.ok) fetchUsers(page);
  };

  const pages = Math.ceil(total/limit)||1;

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input className="border p-2 rounded flex-1" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Tìm theo tên/email..." />
        <button onClick={()=>fetchUsers(1)} className="px-3 py-2 rounded bg-slate-900 text-white">Tìm</button>
      </div>

      {err && <div className="mb-3 text-red-600">{err}</div>}
      {loading ? <div>Đang tải...</div> : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Avatar</th>
                <th className="p-2">Username</th>
                <th className="p-2">Email</th>
                <th className="p-2">Admin</th>
                <th className="p-2">Tạo lúc</th>
                <th className="p-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map(u=>(
                <tr key={u._id} className="border-b">
                  <td className="p-2">
                    <img src={u.avatar||'https://avatars.githubusercontent.com/u/0?v=4'} className="w-10 h-10 rounded-full object-cover" />
                  </td>
                  <td className="p-2">{u.username}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${u.isAdmin?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-700'}`}>
                      {u.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="p-2">{new Date(u.createdAt).toLocaleString()}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={()=>toggleAdmin(u._id, u.isAdmin)} className="px-2 py-1 rounded border">
                      {u.isAdmin ? 'Gỡ Admin' : 'Cấp Admin'}
                    </button>
                    <button onClick={()=>removeUser(u._id)} className="px-2 py-1 rounded bg-red-600 text-white">
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
              {items.length===0 && <tr><td className="p-3" colSpan={6}>Không có dữ liệu</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button disabled={page<=1} onClick={()=>fetchUsers(page-1)} className="px-3 py-1 rounded border disabled:opacity-50">Trước</button>
        <span>Trang {page}/{pages}</span>
        <button disabled={page>=pages} onClick={()=>fetchUsers(page+1)} className="px-3 py-1 rounded border disabled:opacity-50">Sau</button>
      </div>
    </div>
  );
}
