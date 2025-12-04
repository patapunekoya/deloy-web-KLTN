import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaPlus, FaTicketAlt, FaEraser, FaCheck, FaTimes } from 'react-icons/fa';

const emptyForm = {
  code: '',
  type: 'percent',       // 'percent' | 'amount'
  value: 10,             // % hoặc số tiền
  minOrderAmount: 0,     // đơn tối thiểu
  expiresAt: '',         
  isActive: true,
};

export default function AdminCoupons() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setErr('');
      const res = await fetch('/api/coupons', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || data?.success === false) throw new Error(data?.message);
      setItems(data);
    } catch (e) {
      setErr(e.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    if (name === 'value' || name === 'minOrderAmount') {
      setForm((prev) => ({ ...prev, [name]: Number(value) || 0 }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon._id || null);
    setForm({
      code: coupon.code || '',
      type: coupon.type || 'percent',
      value: coupon.value || 0,
      minOrderAmount: coupon.minOrderAmount || 0,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.substring(0, 10) : '',
      isActive: coupon.isActive ?? true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    if (!form.code.trim()) return setErr('Mã giảm giá không được để trống');
    if (form.value <= 0) return setErr('Giá trị giảm phải lớn hơn 0');

    try {
      setSaving(true);
      const payload = { ...form, code: form.code.trim().toUpperCase() };
      const url = editingId ? `/api/coupons/${editingId}` : '/api/coupons';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) throw new Error(data?.message);

      handleResetForm();
      fetchCoupons();
    } catch (e) {
      setErr(e.message || 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá mã giảm giá này?')) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) throw new Error(data?.message);
      
      if (editingId === id) handleResetForm();
      fetchCoupons();
    } catch (e) {
      alert(e.message || 'Xoá thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FaTicketAlt className="text-emerald-600" /> Quản lý Mã Giảm Giá
        </h1>
        <p className="text-slate-500 text-sm mt-1">Tạo và quản lý các chương trình khuyến mãi.</p>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* === 1. FORM SECTION (TOP) === */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-800">
              {editingId ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã mới'}
            </h2>
            {editingId && (
              <button 
                onClick={handleResetForm} 
                className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FaEraser /> Huỷ bỏ & Tạo mới
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              
              {/* Cột 1: Thông tin cơ bản */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Mã Code</label>
                  <input
                    name="code"
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono uppercase font-bold tracking-wide"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="VD: SALE50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Loại</label>
                    <select
                      name="type"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={form.type}
                      onChange={handleChange}
                    >
                      <option value="percent">Theo %</option>
                      <option value="amount">Tiền mặt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Giá trị</label>
                    <input
                      name="value"
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-semibold text-emerald-600"
                      value={form.value}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Cột 2: Điều kiện */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Đơn tối thiểu (VNĐ)</label>
                  <input
                    name="minOrderAmount"
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={form.minOrderAmount}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                
                {/* Ô này để trống để cân bằng grid hoặc có thể thêm thông tin khác sau này */}
                <div className="hidden md:block opacity-0">Placeholder</div>
              </div>

              {/* Cột 3: Trạng thái & Submit */}
              <div className="flex flex-col justify-between">
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Trạng thái</label>
                   <div 
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                    onClick={() => setForm(p => ({...p, isActive: !p.isActive}))}
                   >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${form.isActive ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                      {form.isActive && <FaCheck size={10} />}
                    </div>
                    <span className={`text-sm font-medium ${form.isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {form.isActive ? 'Đang kích hoạt' : 'Tạm ẩn mã này'}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                   {err && <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">{err}</div>}
                   <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                  >
                    {saving ? 'Đang xử lý...' : editingId ? <><FaEdit/> Cập nhật mã</> : <><FaPlus/> Tạo mã ngay</>}
                  </button>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* === 2. LIST SECTION (BOTTOM) === */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Danh sách Mã giảm giá ({items.length})</h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">Đang tải dữ liệu...</div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center">
              <FaTicketAlt size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Chưa có mã giảm giá nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold whitespace-nowrap">
                  <tr>
                    <th className="px-6 py-4 min-w-[140px]">Mã Code</th>
                    <th className="px-6 py-4 min-w-[120px]">Loại giảm</th>
                    <th className="px-6 py-4 text-right min-w-[120px]">Giá trị</th>
                    <th className="px-6 py-4 text-right min-w-[140px]">Đơn tối thiểu</th>
                    <th className="px-6 py-4 text-center min-w-[120px]">Trạng thái</th>
                    <th className="px-6 py-4 text-right min-w-[100px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-800 text-base bg-slate-100 px-2 py-1 rounded">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${
                          c.type === 'percent' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                        }`}>
                          {c.type === 'percent' ? 'Theo %' : 'Tiền mặt'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">
                        {c.type === 'percent' ? `${c.value}%` : `${c.value.toLocaleString('vi-VN')} đ`}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 font-medium">
                        {c.minOrderAmount > 0 ? `${c.minOrderAmount.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {c.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <FaCheck size={10} /> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <FaTimes size={10} /> Tạm tắt
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                            title="Xoá"
                          >
                            <FaTrash />
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

      </div>
    </div>
  );
}