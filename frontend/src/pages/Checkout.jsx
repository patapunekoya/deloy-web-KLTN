import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function Checkout() {
  const location = useLocation();
  const { order, selectedPackage, quantity } = location.state || {};

  if (!order || !selectedPackage) {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          Không tìm thấy thông tin đơn hàng
        </h1>
        <p className="text-sm text-slate-600 mb-4">
          Có thể bạn truy cập trực tiếp vào trang này hoặc session thanh toán
          đã hết.
        </p>
        <Link
          to="/pricing"
          className="inline-flex px-4 py-2 rounded-lg bg-slate-900 text-white text-sm"
        >
          Quay lại trang mua gói tin
        </Link>
      </div>
    );
  }

  const total = order.totalAmount || 0;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-3">
        Hoàn tất thanh toán
      </h1>

      <div className="mb-4 text-sm text-slate-600">
        Cảm ơn bạn đã mua gói tin. Credits đã được cộng vào tài khoản (nếu bạn
        thấy chưa cập nhật hãy tải lại trang hồ sơ).
      </div>

      <div className="rounded-2xl border border-slate-200 p-4 space-y-3 text-sm">
        <div>
          <div className="text-slate-500">Mã đơn hàng</div>
          <div className="font-mono text-xs break-all">{order._id}</div>
        </div>

        <div>
          <div className="text-slate-500">Gói đã mua</div>
          <div className="font-medium text-slate-800">
            {selectedPackage.label}
          </div>
          <div className="text-slate-600">
            Số lượng: <strong>{quantity}</strong>
          </div>
        </div>

        <div>
          <div className="text-slate-500">Tổng tiền</div>
          <div className="font-semibold text-emerald-600">
            {total.toLocaleString('vi-VN', {
              style: 'currency',
              currency: 'VND',
            })}
          </div>
        </div>

        {order.createdAt && (
          <div>
            <div className="text-slate-500">Thời gian</div>
            <div className="text-slate-700">
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <Link
          to="/create-listing"
          className="inline-flex px-4 py-2 rounded-lg bg-emerald-600 text-white"
        >
          Đăng tin ngay
        </Link>
        <Link
          to="/pricing"
          className="inline-flex px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
        >
          Mua thêm gói tin
        </Link>
        <Link
          to="/profile"
          className="inline-flex px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
        >
          Về trang hồ sơ
        </Link>
      </div>
    </div>
  );
}
