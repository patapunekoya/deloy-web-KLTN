// api/controllers/credits.controller.js
import User from '../models/user.model.js';
import CreditOrder from '../models/creditOrder.model.js';
import Coupon from '../models/Coupon.js';
import { errorHandler } from '../utils/error.js';
import payOS from '../utils/payos.js';

// ================== CẤU HÌNH GÓI TIN ==================
export const CREDIT_PACKAGES = [
  // Mua lẻ
  {
    key: 'vip_single',
    label: '1 tin VIP',
    vipCredits: 1,
    premiumCredits: 0,
    price: 25000,
    type: 'single',
  },
  {
    key: 'premium_single',
    label: '1 tin Premium',
    vipCredits: 0,
    premiumCredits: 1,
    price: 100000,
    type: 'single',
  },

  // Combo
  {
    key: 'combo_trial',
    label: 'Combo trải nghiệm (5 tin VIP)',
    vipCredits: 5,
    premiumCredits: 0,
    price: 99000,
    type: 'combo',
  },
  {
    key: 'combo_boost',
    label: 'Combo tăng tốc (3 Premium, 10 VIP)',
    vipCredits: 10,
    premiumCredits: 3,
    price: 399000,
    type: 'combo',
  },
  {
    key: 'combo_leader',
    label: 'Combo dẫn đầu (10 Premium, 20 VIP)',
    vipCredits: 20,
    premiumCredits: 10,
    price: 999000,
    type: 'combo',
  },
];

// GET /api/credits/packages
export const getPackages = (req, res) => {
  res.json(CREDIT_PACKAGES);
};

// ================== HÀM TÍNH GIẢM GIÁ TỪ COUPON ==================
async function applyCouponForOrder({ couponCode, baseAmount }) {
  if (!couponCode) {
    return {
      couponDoc: null,
      discountAmount: 0,
      finalAmount: baseAmount,
    };
  }

  const now = new Date();
  const code = couponCode.trim().toUpperCase();

  const couponDoc = await Coupon.findOne({ code });
  if (!couponDoc) {
    throw errorHandler(400, 'Mã giảm giá không tồn tại');
  }

  if (couponDoc.isActive === false || couponDoc.isLocked === true) {
    throw errorHandler(400, 'Mã giảm giá đã bị khóa hoặc không còn hiệu lực');
  }

  if (
    typeof couponDoc.minOrderAmount === 'number' &&
    couponDoc.minOrderAmount > 0 &&
    baseAmount < couponDoc.minOrderAmount
  ) {
    throw errorHandler(
      400,
      `Đơn hàng phải từ ${couponDoc.minOrderAmount.toLocaleString(
        'vi-VN'
      )}đ trở lên mới dùng được mã này`
    );
  }

  if (couponDoc.startDate && now < couponDoc.startDate) {
    throw errorHandler(400, 'Mã giảm giá này chưa đến thời gian áp dụng');
  }
  if (couponDoc.endDate && now > couponDoc.endDate) {
    throw errorHandler(400, 'Mã giảm giá đã hết hạn');
  }

  if (
    typeof couponDoc.maxUses === 'number' &&
    couponDoc.maxUses > 0 &&
    couponDoc.usedCount >= couponDoc.maxUses
  ) {
    throw errorHandler(400, 'Mã giảm giá đã đạt số lần sử dụng tối đa');
  }

  // === TÍNH SỐ TIỀN GIẢM ===
  let discountAmount = 0;
  if (couponDoc.type === 'percent') {
    discountAmount = Math.round((baseAmount * couponDoc.value) / 100);
  } else if (couponDoc.type === 'amount') {
    discountAmount = couponDoc.value;
  }

  if (
    typeof couponDoc.maxDiscount === 'number' &&
    couponDoc.maxDiscount > 0 &&
    discountAmount > couponDoc.maxDiscount
  ) {
    discountAmount = couponDoc.maxDiscount;
  }

  if (discountAmount < 0) discountAmount = 0;

  let finalAmount = baseAmount - discountAmount;
  if (finalAmount < 0) finalAmount = 0;

  return {
    couponDoc,
    discountAmount,
    finalAmount,
  };
}

// ================== FAKE MANUAL (nếu muốn giữ lại) ==================
// POST /api/credits/confirm
export const confirmPackagePurchase = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(errorHandler(401, 'Unauthorized'));
    }

    const userId = req.user.id;
    const { packageKey, quantity = 1, couponCode } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    const pkg = CREDIT_PACKAGES.find((p) => p.key === packageKey);
    if (!pkg) {
      return next(errorHandler(400, 'Gói tin không hợp lệ'));
    }

    const qty = Number(quantity) > 0 ? Number(quantity) : 1;
    const baseAmount = pkg.price * qty;

    let couponDoc = null;
    let discountAmount = 0;
    let finalAmount = baseAmount;

    try {
      const couponResult = await applyCouponForOrder({
        couponCode,
        baseAmount,
      });
      couponDoc = couponResult.couponDoc;
      discountAmount = couponResult.discountAmount;
      finalAmount = couponResult.finalAmount;
    } catch (couponErr) {
      return next(couponErr);
    }

    if (couponDoc) {
      couponDoc.usedCount = (couponDoc.usedCount || 0) + 1;
      if (
        typeof couponDoc.maxUses === 'number' &&
        couponDoc.maxUses > 0 &&
        couponDoc.usedCount >= couponDoc.maxUses
      ) {
        couponDoc.isLocked = true;
      }
      await couponDoc.save();
    }

    const itemTotalPrice = baseAmount;

    const order = await CreditOrder.create({
      user: userId,
      items: [
        {
          packageKey: pkg.key,
          label: pkg.label,
          vipCredits: pkg.vipCredits * qty,
          premiumCredits: pkg.premiumCredits * qty,
          unitPrice: pkg.price,
          quantity: qty,
          totalPrice: itemTotalPrice,
        },
      ],
      subtotal: baseAmount,
      couponCode: couponDoc?.code || null,
      couponDiscount: discountAmount,
      totalAmount: finalAmount,
      status: 'paid',
      paymentMethod: 'qr_fake',
    });

    user.vipCredits = (user.vipCredits || 0) + pkg.vipCredits * qty;
    user.premiumCredits =
      (user.premiumCredits || 0) + pkg.premiumCredits * qty;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.json({
      success: true,
      message: 'Đã cộng gói tin vào tài khoản (fake)',
      user: safeUser,
      order,
    });
  } catch (err) {
    next(err);
  }
};

// ================== TẠO ĐƠN THANH TOÁN PAYOS ==================
// POST /api/credits/create-order
export const createPayOSOrder = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(errorHandler(401, 'Unauthorized'));
    }

    const userId = req.user.id;
    const { packageKey, quantity = 1, couponCode } = req.body || {};

    const user = await User.findById(userId);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    const pkg = CREDIT_PACKAGES.find((p) => p.key === packageKey);
    if (!pkg) {
      return next(errorHandler(400, 'Gói tin không hợp lệ'));
    }

    const qty = Number(quantity) > 0 ? Number(quantity) : 1;
    const baseAmount = pkg.price * qty;

    if (baseAmount <= 0) {
      return next(errorHandler(400, 'Số tiền thanh toán không hợp lệ'));
    }

    // Áp dụng coupon
    let couponDoc = null;
    let discountAmount = 0;
    let finalAmount = baseAmount;

    try {
      const couponResult = await applyCouponForOrder({
        couponCode,
        baseAmount,
      });
      couponDoc = couponResult.couponDoc;
      discountAmount = couponResult.discountAmount;
      finalAmount = couponResult.finalAmount;
    } catch (couponErr) {
      return next(couponErr);
    }

    // ⚠️ CASE: ĐƠN ĐƯỢC GIẢM HẾT (0đ) → KHÔNG QUA PAYOS
    if (finalAmount <= 0) {
      // Cập nhật coupon (coi như dùng thành công)
      if (couponDoc) {
        couponDoc.usedCount = (couponDoc.usedCount || 0) + 1;
        if (
          typeof couponDoc.maxUses === 'number' &&
          couponDoc.maxUses > 0 &&
          couponDoc.usedCount >= couponDoc.maxUses
        ) {
          couponDoc.isLocked = true;
        }
        await couponDoc.save();
      }

      const itemTotalPrice = baseAmount;

      const order = await CreditOrder.create({
        user: userId,
        items: [
          {
            packageKey: pkg.key,
            label: pkg.label,
            vipCredits: pkg.vipCredits * qty,
            premiumCredits: pkg.premiumCredits * qty,
            unitPrice: pkg.price,
            quantity: qty,
            totalPrice: itemTotalPrice,
          },
        ],
        subtotal: baseAmount,
        couponCode: couponDoc?.code || null,
        couponDiscount: discountAmount,
        totalAmount: 0,
        status: 'paid',
        paymentMethod: 'coupon_free',
        payosOrderCode: null,
        payosStatus: 'FREE',
        isCreditsApplied: true,
      });

      // cộng credits cho user
      user.vipCredits = (user.vipCredits || 0) + pkg.vipCredits * qty;
      user.premiumCredits =
        (user.premiumCredits || 0) + pkg.premiumCredits * qty;
      await user.save();

      const safeUser = user.toObject();
      delete safeUser.password;

      return res.status(200).json({
        success: true,
        mode: 'free',
        status: 'paid',
        order,
        user: safeUser,
      });
    }

    // Đơn > 0đ: phải thanh toán tối thiểu 1.000đ
    if (finalAmount < 1000) {
      return next(errorHandler(400, 'Đơn hàng tối thiểu 1.000đ'));
    }

    const orderCode = Math.floor(Date.now() / 1000);

    const descriptionBase = 'KLTN_BatDongSan';
    const description = descriptionBase.slice(0, 25);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const returnUrl =
      process.env.PAYOS_RETURN_URL || `${clientUrl}/payment/success`;

    const cancelUrl =
      process.env.PAYOS_CANCEL_URL || `${clientUrl}/payment/cancel`;

    const paymentData = {
      orderCode,
      amount: finalAmount,
      description,
      items: [
        {
          name: pkg.label.slice(0, 25),
          quantity: qty,
          price: finalAmount,
        },
      ],
      returnUrl,
      cancelUrl,
    };

    const paymentLink = await payOS.paymentRequests.create(paymentData);

    const itemTotalPrice = baseAmount;

    const order = await CreditOrder.create({
      user: userId,
      items: [
        {
          packageKey: pkg.key,
          label: pkg.label,
          vipCredits: pkg.vipCredits * qty,
          premiumCredits: pkg.premiumCredits * qty,
          unitPrice: pkg.price,
          quantity: qty,
          totalPrice: itemTotalPrice,
        },
      ],
      subtotal: baseAmount,
      couponCode: couponDoc?.code || null,
      couponDiscount: discountAmount,
      totalAmount: finalAmount,
      status: 'pending',
      paymentMethod: 'payos',
      payosOrderCode: paymentLink.orderCode,
      payosStatus: 'PENDING',
      payosRaw: paymentLink,
      isCreditsApplied: false,
    });

    console.log('[PAYOS] Created payment link:', paymentLink.checkoutUrl);

    res.status(200).json({
      success: true,
      checkoutUrl: paymentLink.checkoutUrl,
      payOSOrderCode: paymentLink.orderCode,
      orderId: order._id,
    });
  } catch (err) {
    console.error('[PAYOS] create-order error:', err?.response?.data || err);
    next(err);
  }
};

// ================== WEBHOOK PAYOS ==================
// POST /api/credits/webhook/payos
export const handlePayOSWebhook = async (req, res) => {
  try {
    const webhookData = payOS.webhooks.verify(req.body);
    console.log('[PAYOS] Webhook data:', webhookData);

    const data = webhookData.data || webhookData;
    const { orderCode, status } = data;

    const order = await CreditOrder.findOne({ payosOrderCode: orderCode }).populate(
      'user'
    );
    if (!order) {
      console.warn('[PAYOS] Webhook: order not found for code', orderCode);
      return res.status(200).send('OK');
    }

    order.payosStatus = status;
    order.payosRaw = data;

    // normalize
    if (status === 'PAID') {
      order.status = 'paid';
    } else if (['CANCELLED', 'EXPIRED', 'FAILED'].includes(status)) {
      order.status = 'cancelled';
    }

    // cộng credits nếu chưa cộng lần nào
    if (order.status === 'paid' && !order.isCreditsApplied && order.user) {
      const item = order.items?.[0];
      if (item) {
        order.user.vipCredits =
          (order.user.vipCredits || 0) + (item.vipCredits || 0);
        order.user.premiumCredits =
          (order.user.premiumCredits || 0) + (item.premiumCredits || 0);
        await order.user.save();
      }
      order.isCreditsApplied = true;
    }

    await order.save();

    res.status(200).send('OK');
  } catch (error) {
    console.error(
      '[PAYOS] Webhook verify error:',
      error?.response?.data || error
    );
    res.status(400).send('Invalid webhook');
  }
};

// ================== CONFIRM TỪ RETURN URL (PaymentSuccess.jsx) ==================
// POST /api/credits/confirm-payos
export const confirmPayOSFromReturnUrl = async (req, res, next) => {
  try {
    const { orderCode, orderId } = req.body || {};

    if (!orderCode && !orderId) {
      return next(
        errorHandler(400, 'Thiếu orderCode hoặc orderId để xác nhận thanh toán')
      );
    }

    // tìm order trong DB
    let order;
    if (orderId) {
      order = await CreditOrder.findById(orderId).populate('user');
    } else {
      const codeNum = Number(orderCode);
      order = await CreditOrder.findOne({
        payosOrderCode: codeNum,
      }).populate('user');
    }

    if (!order) {
      return next(errorHandler(404, 'Không tìm thấy đơn hàng tương ứng'));
    }

    let payStatus = order.payosStatus;

    // gọi PayOS để chắc chắn trạng thái (nếu có orderCode)
    try {
      if (order.payosOrderCode) {
        const info = await payOS.paymentRequests.get(order.payosOrderCode);
        payStatus = info?.status || payStatus;
      }
    } catch (e) {
      console.warn('[PAYOS] get() error:', e?.response?.data || e.message);
    }

    // normalize status từ payOS
    let normalizedStatus = order.status;
    if (payStatus === 'PAID') {
      normalizedStatus = 'paid';
    } else if (['CANCELLED', 'EXPIRED', 'FAILED'].includes(payStatus)) {
      normalizedStatus = 'cancelled';
    }

    order.payosStatus = payStatus;

    if (normalizedStatus === 'paid') {
      order.status = 'paid';

      if (!order.isCreditsApplied && order.user) {
        const item = order.items?.[0];
        if (item) {
          order.user.vipCredits =
            (order.user.vipCredits || 0) + (item.vipCredits || 0);
          order.user.premiumCredits =
            (order.user.premiumCredits || 0) + (item.premiumCredits || 0);
          await order.user.save();
        }
        order.isCreditsApplied = true;
      }
    } else if (
      normalizedStatus === 'cancelled' &&
      order.status === 'pending'
    ) {
      order.status = 'cancelled';
    }

    await order.save();

    const safeUser = order.user ? order.user.toObject() : null;
    if (safeUser) {
      delete safeUser.password;
    }

    res.json({
      success: true,
      status: normalizedStatus,
      order,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
};

// ================== ADMIN XEM ĐƠN HÀNG ==================
// GET /api/credits/admin/orders?search=&page=&limit=
export const adminListOrders = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search || '').trim();
    const skip = (page - 1) * limit;

    const allOrders = await CreditOrder.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    let filtered = allOrders;
    if (search) {
      const regex = new RegExp(search, 'i');
      filtered = allOrders.filter((o) => {
        const u = o.user || {};
        return (
          regex.test(u.username || '') ||
          regex.test(u.email || '') ||
          regex.test(o._id.toString())
        );
      });
    }

    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit).map((o) => ({
      _id: o._id,
      user: o.user
        ? {
            _id: o.user._id,
            username: o.user.username,
            email: o.user.email,
          }
        : null,
      items: o.items,
      subtotal: o.subtotal,
      couponCode: o.couponCode,
      couponDiscount: o.couponDiscount,
      totalAmount: o.totalAmount,
      status: o.status,
      paymentMethod: o.paymentMethod,
      payOSOrderCode: o.payosOrderCode,
      payOSStatus: o.payosStatus,
      createdAt: o.createdAt,
    }));

    res.json({
      success: true,
      items,
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};


export const getUserHistory = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(errorHandler(401, 'Unauthorized'));
    }
    // Tìm đơn hàng của user đó, sắp xếp mới nhất trước
    const orders = await CreditOrder.find({ user: req.user.id })
      .sort({ createdAt: -1 });
      
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};