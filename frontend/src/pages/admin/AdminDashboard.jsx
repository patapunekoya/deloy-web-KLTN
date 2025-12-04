import React, { useEffect, useState } from 'react';
import { FaUsers, FaHome, FaShoppingCart, FaMoneyBillWave } from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalOrders: 0,
    totalRevenue: 0,
    chartData: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu thống kê...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Tổng quan hệ thống</h2>

      {/* 1. CARDS THỐNG KÊ TỔNG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Người dùng" 
          value={stats.totalUsers} 
          icon={<FaUsers size={20} />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Tin đăng" 
          value={stats.totalListings} 
          icon={<FaHome size={20} />} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Đơn hàng thành công" 
          value={stats.totalOrders} 
          icon={<FaShoppingCart size={20} />} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Tổng doanh thu" 
          value={stats.totalRevenue.toLocaleString('vi-VN') + ' đ'} 
          icon={<FaMoneyBillWave size={20} />} 
          color="bg-amber-500" 
        />
      </div>

      {/* 2. BIỂU ĐỒ DOANH THU (MỚI) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Biểu đồ doanh thu (6 tháng gần nhất)</h3>
        <div className="h-72 w-full">
          {stats.chartData && stats.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  tickFormatter={(value) => 
                    value >= 1000000 ? `${value/1000000}M` : `${value/1000}k`
                  }
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [value.toLocaleString('vi-VN') + ' đ', 'Doanh thu']}
                />
                <Bar dataKey="DoanhThu" name="Doanh thu" radius={[4, 4, 0, 0]} barSize={40}>
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#10b981" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              Chưa có dữ liệu doanh thu trong 6 tháng qua
            </div>
          )}
        </div>
      </div>

      {/* 3. DANH SÁCH GIAO DỊCH MỚI NHẤT */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Giao dịch mới nhất</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Khách hàng</th>
                <th className="px-6 py-3 text-right">Số tiền</th>
                <th className="px-6 py-3 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentOrders.map(order => (
                <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium text-slate-900">{order.user?.username || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{order.user?.email}</div>
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-emerald-600">
                    +{order.totalAmount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-6 py-3 text-right text-slate-500 text-xs">
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                 <tr><td colSpan="3" className="p-8 text-center text-slate-500">Chưa có giao dịch nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
      <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/5`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-xs uppercase font-semibold tracking-wider">{title}</p>
        <h4 className="text-xl font-bold text-slate-800 mt-0.5">{value}</h4>
      </div>
    </div>
  );
}