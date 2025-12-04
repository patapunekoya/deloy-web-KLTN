// src/pages/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { updateUserSuccess } from '../redux/userSlice';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser } = useSelector((s) => s.user);

  // bỏ generic kiểu TypeScript, đây là file .jsx
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

        // Nếu khi tạo order FE có truyền kèm orderId vào returnUrl thì lấy ra luôn
        const orderIdFromQuery =
          search.get('orderId') || search.get('order_id') || null;

        if (!orderCodeFromQuery && !orderIdFromQuery) {
          setStatus('error');
          setMessage('Không tìm thấy mã đơn hàng để xác nhận thanh toán.');
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
          console.error('confirm-payos error:', data);
          setStatus('error');
          setMessage(
            data?.message ||
              'Không xác nhận được trạng thái thanh toán. Vui lòng kiểm tra lại.'
          );
          return;
        }

        const order = data.order;
        const user = data.user;

        // 🔥 CẬP NHẬT REDUX USER NGAY SAU KHI PAYOS CONFIRM
        if (user) {
          // giữ đúng format bạn đang xài: currentUser?.rest ?? currentUser
          const nextUser = {
            ...(currentUser || {}),
            rest: user,
          };
          dispatch(updateUserSuccess(nextUser));
        }

        if (data.status === 'paid') {
          toast.success(
            'Thanh toán thành công! Credits đã được cộng vào tài khoản.'
          );
        } else if (data.status === 'cancelled') {
          toast.error('Thanh toán đã bị huỷ hoặc hết hạn.');
        } else {
          toast('Đơn hàng đang ở trạng thái: ' + data.status);
        }

        setStatus('ok');

        // Điều hướng sang trang Checkout với thông tin order
        navigate('/checkout', {
          replace: true,
          state: {
            order,
            selectedPackage: order?.items?.[0]
              ? {
                  label: order.items[0].label,
                  key: order.items[0].packageKey,
                  price: order.items[0].unitPrice,
                  vipCredits: order.items[0].vipCredits,
                  premiumCredits: order.items[0].premiumCredits,
                }
              : null,
            quantity: order?.items?.[0]?.quantity || 1,
          },
        });
      } catch (e) {
        console.error('confirm-payos exception:', e);
        setStatus('error');
        setMessage(e.message || 'Có lỗi khi xác nhận thanh toán.');
      }
    };

    run();
  }, [location.search, navigate, currentUser, dispatch]);

  if (status === 'loading') {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-6">
        <h1 className="text-xl font-semibold mb-2">Đang xử lý thanh toán...</h1>
        <p className="text-sm text-slate-600">
          Vui lòng chờ trong giây lát. Hệ thống đang xác nhận kết quả từ PayOS.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-6">
        <h1 className="text-xl font-semibold mb-2 text-red-600">
          Không thể xác nhận thanh toán
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

  // status === 'ok' thì component này redirect sang /checkout rồi, không cần render gì
  return null;
}
