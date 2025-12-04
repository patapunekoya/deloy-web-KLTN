// src/pages/Pricing.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { updateUserSuccess } from '../redux/userSlice';

export default function Pricing() {
  const { currentUser } = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const me = currentUser?.rest ?? currentUser ?? null;

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // trạng thái tạo phiên thanh toán PayOS
  const [creatingPayment, setCreatingPayment] = useState(false);

  // ==== COUPON STATE ====
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    async function fetchPackages() {
      try {
        setLoading(true);
        const res = await fetch('/api/credits/packages');
        if (!res.ok) throw new Error('Không lấy được gói tin');
        const data = await res.json();
        setPackages(data);
      } catch (e) {
        console.error(e);
        // fallback hardcode nếu API lỗi
        setPackages([
          {
            key: 'vip_single',
            label: '1 tin VIP',
            vipCredits: 1,
            premiumCredits: 0,
            price: 25000,
          },
          {
            key: 'premium_single',
            label: '1 tin Premium',
            vipCredits: 0,
            premiumCredits: 1,
            price: 100000,
          },
          {
            key: 'combo_trial',
            label: 'Combo trải nghiệm (5 tin VIP)',
            vipCredits: 5,
            premiumCredits: 0,
            price: 99000,
          },
          {
            key: 'combo_boost',
            label: 'Combo tăng tốc (3 Premium, 10 VIP)',
            vipCredits: 10,
            premiumCredits: 3,
            price: 399000,
          },
          {
            key: 'combo_leader',
            label: 'Combo dẫn đầu (10 Premium, 20 VIP)',
            vipCredits: 20,
            premiumCredits: 10,
            price: 999000,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, []);

  const handleChoosePackage = (pkg) => {
    if (!currentUser) {
      toast.error('Bạn cần đăng nhập để mua gói tin');
      return;
    }
    setSelected(pkg);
    setQuantity(1);

    // reset coupon khi đổi gói
    setCoupon(null);
    setCouponCode('');
    setDiscountAmount(0);
    setFinalAmount(0);
    setCouponError('');
  };

  const vipCredits = me?.vipCredits ?? 0;
  const premiumCredits = me?.premiumCredits ?? 0;

  const singles = packages.filter((p) => p.key?.includes('single'));
  const combos = packages.filter((p) => p.key?.includes('combo'));

  // Tạm tính trước giảm
  const subtotal =
    selected && quantity > 0 ? (selected.price || 0) * quantity : 0;

// Số tiền thực phải trả
const payableAmount = coupon
  ? (typeof finalAmount === 'number' ? finalAmount : subtotal)
  : subtotal;


  // ==== APPLY COUPON ====
  const handleApplyCoupon = async () => {
    if (!selected) {
      setCouponError('Vui lòng chọn gói trước khi áp dụng mã');
      return;
    }
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      setApplyingCoupon(true);
      setCouponError('');

      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: couponCode.trim(),
          orderAmount: subtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) {
        setCoupon(null);
        setDiscountAmount(0);
        setFinalAmount(subtotal);
        setCouponError(data?.message || 'Mã giảm giá không hợp lệ');
        return;
      }

      setCoupon(data.coupon);
      setDiscountAmount(data.discountAmount || 0);
      setFinalAmount(
        typeof data.finalAmount === 'number' ? data.finalAmount : subtotal
      );
      toast.success('Đã áp dụng mã giảm giá');
    } catch (e) {
      console.error(e);
      setCouponError(e.message || 'Có lỗi khi áp dụng mã giảm giá');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleClearCoupon = () => {
    setCoupon(null);
    setCouponCode('');
    setDiscountAmount(0);
    setFinalAmount(0);
    setCouponError('');
  };

  // ==== TẠO ĐƠN THANH TOÁN PAYOS / ĐƠN FREE ====
  const handlePayWithPayOS = async () => {
    if (!selected) return;

    if (!currentUser) {
      toast.error('Bạn cần đăng nhập để mua gói tin');
      return;
    }

    if (subtotal <= 0) {
      toast.error('Số tiền thanh toán không hợp lệ');
      return;
    }

    try {
      setCreatingPayment(true);

      const res = await fetch('/api/credits/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          packageKey: selected.key,
          quantity,
          couponCode: coupon?.code || couponCode || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.success === false) {
        toast.error(data?.message || 'Không tạo được đơn hàng');
        return;
      }

      // 🔥 CASE 1: ĐƠN 0Đ (FREE, KHÔNG CẦN QUA PAYOS)
      if (data.mode === 'free' && data.status === 'paid') {
        toast.success('Đơn hàng 0đ, credits đã được cộng vào tài khoản.');

        if (data.user) {
          const nextUser = {
            ...(currentUser || {}),
            rest: data.user,
          };
          dispatch(updateUserSuccess(nextUser));
        }

        const order = data.order;
        navigate('/checkout', {
          replace: true,
          state: {
            order,
            selectedPackage: {
              key: selected.key,
              label: selected.label,
              price: selected.price,
              vipCredits: selected.vipCredits,
              premiumCredits: selected.premiumCredits,
            },
            quantity,
          },
        });
        return;
      }

      // 🔥 CASE 2: ĐƠN CÓ THU TIỀN → REDIRECT PAYOS
      if (!data.checkoutUrl) {
        toast.error('Không tạo được phiên thanh toán PayOS');
        return;
      }

      // Lưu lại thông tin order vào sessionStorage để trang /payment/success đọc lại
      const payload = {
        orderId: data.orderId,
        payOSOrderCode: data.payOSOrderCode,
        selectedPackage: {
          key: selected.key,
          label: selected.label,
          price: selected.price,
          vipCredits: selected.vipCredits,
          premiumCredits: selected.premiumCredits,
        },
        quantity,
      };

      try {
        window.sessionStorage.setItem(
          'hs_last_credit_order',
          JSON.stringify(payload)
        );
      } catch {
        // không lưu được thì cũng kệ, vẫn redirect
      }

      toast.success('Đang chuyển đến PayOS để thanh toán...');
      window.location.href = data.checkoutUrl;
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Có lỗi khi tạo thanh toán');
    } finally {
      setCreatingPayment(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Gói tin đăng nhà
        </h1>
        <p className="text-slate-500 mt-2">
          Chọn gói tin & áp dụng mã giảm giá (nếu có), sau đó thanh toán qua PayOS.
        </p>
      </div>

      {/* Credits hiện có */}
      {me && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            VIP còn: <strong>{vipCredits}</strong> tin
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            Premium còn: <strong>{premiumCredits}</strong> tin
          </span>
          <Link to="/profile" className="text-emerald-600 hover:underline">
            Xem lịch sử mua gói
          </Link>
        </div>
      )}

      {/* GRID 3 CỘT: trái (2 cột) sản phẩm, phải (1 cột) thanh toán */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* LEFT: col-span-2, chứa các gói */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gói lẻ */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg md:text-xl font-semibold text-slate-800">
                Gói lẻ
              </h2>
              <span className="text-xs text-slate-500">
                Chọn 1 gói để thanh toán ở panel bên phải
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tin thường */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col h-full">
                <h3 className="font-semibold text-slate-800 mb-1">
                  Tin thường
                </h3>
                <p className="text-3xl font-bold text-emerald-600 mb-1">
                  Miễn phí
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Hiển thị 10 ngày, 1 ảnh nhỏ. Thông tin liên hệ chỉ
                  hiển thị trong trang chi tiết.
                </p>
                <ul className="text-xs text-slate-600 space-y-1 mb-4">
                  <li>• Hiển thị sau các tin VIP &amp; Premium</li>
                  <li>• 10 ngày hiển thị</li>
                  <li>• 1 ảnh nhỏ</li>
                </ul>
                <Link
                  to="/create-listing"
                  className="mt-auto inline-flex items-center justify-center px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:opacity-90"
                >
                  Đăng tin miễn phí
                </Link>
              </div>

              {/* Tin VIP / Premium lẻ */}
              {singles.map((pkg) => (
                <div
                  key={pkg.key}
                  className={`rounded-2xl border p-4 flex flex-col h-full cursor-pointer transition ${
                    selected?.key === pkg.key
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                  onClick={() => handleChoosePackage(pkg)}
                >
                  <h3 className="font-semibold text-slate-800 mb-1">
                    {pkg.label}
                  </h3>
                  <p className="text-3xl font-bold text-emerald-600 mb-1">
                    {(pkg.price || 0).toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    {pkg.key.includes('vip')
                      ? 'Tin VIP: ưu tiên hơn tin thường, 15 ngày, 1 ảnh vừa + 3 ảnh nhỏ.'
                      : 'Tin Premium: ưu tiên cao nhất, 20 ngày, 2 ảnh lớn + 1 ảnh vừa + 2 ảnh nhỏ.'}
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1 mb-4">
                    <li>• Hiển thị nổi bật trên bảng tin</li>
                    <li>
                      • Thông tin liên hệ hiển thị ngay trong trang danh sách
                    </li>
                  </ul>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChoosePackage(pkg);
                    }}
                    className="mt-auto inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:opacity-90"
                  >
                    Chọn gói này
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Combo */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg md:text-xl font-semibold text-slate-800">
                Combo nhiều tin
              </h2>
              {loading && (
                <span className="text-xs text-slate-500">
                  Đang tải gói combo…
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {combos.map((pkg) => (
                <div
                  key={pkg.key}
                  className={`rounded-2xl border p-4 flex flex-col h-full cursor-pointer transition ${
                    selected?.key === pkg.key
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                  onClick={() => handleChoosePackage(pkg)}
                >
                  <h3 className="font-semibold text-slate-800 mb-1">
                    {pkg.label}
                  </h3>
                  <p className="text-3xl font-bold text-emerald-600 mb-1">
                    {(pkg.price || 0).toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    Bao gồm {pkg.vipCredits} tin VIP và {pkg.premiumCredits} tin
                    Premium.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1 mb-4">
                    <li>• Tiết kiệm hơn mua lẻ</li>
                    <li>• Phù hợp khi chạy nhiều chiến dịch cùng lúc</li>
                  </ul>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChoosePackage(pkg);
                    }}
                    className="mt-auto inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:opacity-90"
                  >
                    Chọn combo này
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT: thanh toán + mã giảm giá */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm lg:sticky lg:top-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-800 mb-3">
              Thông tin thanh toán
            </h2>

            {!selected ? (
              <p className="text-sm text-slate-500">
                Vui lòng chọn một gói ở panel bên trái để xem chi tiết thanh
                toán.
              </p>
            ) : (
              <>
                {/* Tóm tắt đơn hàng */}
                <div className="mb-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gói:</span>
                    <span className="font-medium text-slate-800 text-right">
                      {selected.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Đơn giá:</span>
                    <span className="font-medium text-slate-800">
                      {(selected.price || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-slate-600">Số lượng:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        className="w-24 border rounded px-2 py-1 text-sm text-right"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-200 my-2" />

                  <div className="flex justify-between">
                    <span className="text-slate-600">Tạm tính:</span>
                    <span className="font-medium text-slate-800">
                      {subtotal.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  {coupon && (
                    <div className="flex justify-between text-emerald-700">
                      <span>
                        Giảm giá ({coupon.code}
                        {coupon.type === 'percent'
                          ? ` -${coupon.value}%`
                          : ''}
                        )
                      </span>
                      <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-semibold mt-1">
                    <span>Tổng thanh toán:</span>
                    <span className="text-emerald-600">
                      {payableAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                {/* Nhập mã giảm giá */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá"
                      className="flex-1 border rounded-lg px-3 py-2 text-sm"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                    />
                    {!coupon ? (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || subtotal <= 0}
                        className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-60 hover:opacity-90"
                      >
                        {applyingCoupon ? 'Đang áp dụng…' : 'Áp dụng'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleClearCoupon}
                        className="px-3 py-2 rounded-lg border text-sm text-slate-600 hover:bg-slate-50"
                      >
                        Hủy mã
                      </button>
                    )}
                  </div>
                  {couponError && (
                    <p className="mt-1 text-xs text-red-500">{couponError}</p>
                  )}
                  {coupon && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Mã <strong>{coupon.code}</strong> đã được áp dụng.
                    </p>
                  )}
                </div>

                {/* Hướng dẫn PayOS */}
                <div className="mb-4 rounded-2xl border border-dashed border-slate-300 p-3 text-[11px] text-slate-500">
                  <p>
                    Sau khi bấm{' '}
                    <span className="font-semibold">
                      "Thanh toán qua PayOS"
                    </span>
                    , bạn sẽ được chuyển đến cổng thanh toán PayOS để quét QR /
                    thanh toán online.
                  </p>
                  <p className="mt-1">
                    Khi thanh toán thành công, hệ thống sẽ tự động cộng gói tin
                    vào tài khoản của bạn thông qua webhook (có thể chờ vài
                    giây). Với đơn 0đ (được giảm hết), hệ thống sẽ cộng credits
                    ngay mà không cần qua PayOS.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePayWithPayOS}
                  disabled={creatingPayment || subtotal <= 0}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
                >
                  {creatingPayment
                    ? payableAmount === 0
                      ? 'Đang hoàn tất đơn 0đ…'
                      : 'Đang tạo phiên thanh toán…'
                    : payableAmount === 0
                      ? 'Hoàn tất đơn (0đ với mã giảm giá)'
                      : 'Thanh toán qua PayOS'}
                </button>

{/* 
                <p className="mt-2 text-[11px] text-slate-500">
                  Lưu ý: Đây là môi trường Sandbox của PayOS dành cho phát triển.
                  Khi lên production, hãy cấu hình lại domain & webhook trong
                  Dashboard PayOS.
                </p> */}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
