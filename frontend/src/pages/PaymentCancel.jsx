// src/pages/PaymentCancel.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function PaymentCancel() {
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const search = new URLSearchParams(location.search);
        const orderCodeFromQuery =
          search.get('orderCode') ||
          search.get('code') ||
          search.get('order_code') ||
          null;

        // nếu sau này bạn append orderId vào cancelUrl thì lấy luôn
        const orderIdFromQuery =
          search.get('orderId') || search.get('order_id') || null;

        if (!orderCodeFromQuery && !orderIdFromQuery) {
          setStatus('error');
          setMessage(
            'Không tìm thấy thông tin đơn hàng. Có thể bạn đã truy cập trang này sai cách.'
          );
          return;
        }

        const res = await fetch('/api/credits/confirm-payos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            orderCode: orderCodeFromQuery,
            orderId: orderIdFromQuery,
          }),
        });

        const data = await res.json();

        if (!res.ok || data?.success === false) {
          console.error('confirm-payos (cancel) error:', data);
          setStatus('error');
          setMessage(
            data?.message ||
              'Không xác nhận được trạng thái thanh toán. Vui lòng kiểm tra lại.'
          );
          return;
        }

        // server trả về status normalized
        const statusFromServer = data.status;

        if (statusFromServer === 'cancelled') {
          toast('Bạn đã huỷ thanh toán. Đơn hàng đã được đánh dấu là đã huỷ.');
        } else if (statusFromServer === 'paid') {
          toast.success(
            'Thanh toán đã hoàn tất trước đó. Đơn đã được ghi nhận.'
          );
          // nếu bạn muốn auto chuyển sang checkout luôn cũng được,
          // nhưng thôi, ở trang cancel chỉ thông báo nhẹ nhàng
        } else {
          toast('Đơn hàng đang ở trạng thái: ' + statusFromServer);
        }

        setStatus('ok');
      } catch (e) {
        console.error('confirm-payos (cancel) exception:', e);
        setStatus('error');
        setMessage(e.message || 'Có lỗi khi xác nhận trạng thái thanh toán.');
      }
    };

    run();
  }, [location.search]);

  if (status === 'loading') {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-6">
        <h1 className="text-xl font-semibold mb-2">Đang xử lý huỷ thanh toán...</h1>
        <p className="text-sm text-slate-600">
          Hệ thống đang cập nhật trạng thái đơn hàng. Vui lòng đợi trong giây lát.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-6">
        <h1 className="text-xl font-semibold mb-2 text-red-600">
          Không thể cập nhật trạng thái đơn hàng
        </h1>
        <p className="text-sm text-slate-600 mb-4">{message}</p>
        <Link
          to="/pricing"
          className="inline-flex px-4 py-2 rounded-lg bg-slate-900 text-white text-sm"
        >
          Quay lại trang mua gói tin
        </Link>
      </div>
    );
  }

  // status === 'ok'
  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-2">Thanh toán đã được huỷ</h1>
      <p className="text-sm text-slate-600 mb-4">
        Bạn đã huỷ phiên thanh toán trên PayOS. Đơn hàng tương ứng đã được đánh dấu
        là <span className="font-semibold">đã huỷ</span> trong hệ thống (nếu tồn tại).
      </p>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/pricing"
          className="inline-flex px-4 py-2 rounded-lg bg-emerald-600 text-white"
        >
          Mua lại gói tin khác
        </Link>
        <Link
          to="/profile"
          className="inline-flex px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
        >
          Về trang hồ sơ
        </Link>
        <Link
          to="/"
          className="inline-flex px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
