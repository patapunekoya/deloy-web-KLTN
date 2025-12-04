import Coupon from '../models/Coupon.js';
import { errorHandler } from '../utils/error.js';

// GET /api/coupons  (admin xem danh sách)
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (err) {
    next(err);
  }
};

// POST /api/coupons  (admin tạo / cập nhật)
export const upsertCoupon = async (req, res, next) => {
  try {
    const {
      _id,
      code,
      type,
      value,
      minOrderAmount,
      expiresAt,
      isActive,
    } = req.body;

    if (!code || !type || value == null) {
      return next(errorHandler(400, 'Thiếu dữ liệu mã giảm giá'));
    }

    const payload = {
      code: String(code).trim().toUpperCase(),
      type,
      value,
      minOrderAmount: minOrderAmount ?? 0,
      isActive: isActive ?? true,
    };

    if (expiresAt) {
      const d = new Date(expiresAt);
      if (!isNaN(d.getTime())) {
        payload.expiresAt = d;
      }
    }

    let coupon;
    if (_id) {
      coupon = await Coupon.findByIdAndUpdate(
        _id,
        { $set: payload },
        { new: true, runValidators: true }
      );
      if (!coupon) {
        return next(errorHandler(404, 'Coupon không tồn tại'));
      }
    } else {
      coupon = await Coupon.create({
        ...payload,
        createdBy: req.user?.id,
      });
    }

    res.status(200).json(coupon);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/coupons/:id  (admin xoá mã)
export const deleteCoupon = async (req, res, next) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return next(errorHandler(404, 'Coupon không tồn tại'));
    }
    res.status(200).json({ success: true, message: 'Đã xoá coupon' });
  } catch (err) {
    next(err);
  }
};

// (OPTIONAL) POST /api/coupons/validate  – dùng lúc checkout nếu muốn
export const validateCoupon = async (req, res, next) => {
  try {
    let { code, orderAmount } = req.body || {};
    if (!code) {
      return next(errorHandler(400, 'Thiếu mã giảm giá'));
    }

    code = String(code).trim().toUpperCase();
    const amount = Number(orderAmount) || 0;

    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return next(errorHandler(400, 'Mã giảm giá không tồn tại'));
    }

    // inactive / locked
    if (coupon.isActive === false) {
      return next(errorHandler(400, 'Mã giảm giá đã bị tắt / không còn hiệu lực'));
    }
    if (coupon.isLocked === true) {
      return next(errorHandler(400, 'Mã giảm giá đã bị khoá bởi quản trị viên'));
    }

    const now = new Date();

    // check ngày bắt đầu
    if (coupon.startDate && coupon.startDate > now) {
      return next(errorHandler(400, 'Mã giảm giá chưa đến thời gian áp dụng'));
    }

    // check ngày hết hạn
    if (coupon.endDate && coupon.endDate < now) {
      return next(errorHandler(400, 'Mã giảm giá đã hết hạn'));
    }

    // check min order
    if (
      typeof coupon.minOrderAmount === 'number' &&
      coupon.minOrderAmount > 0 &&
      amount < coupon.minOrderAmount
    ) {
      return next(
        errorHandler(
          400,
          `Đơn hàng cần tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ để dùng mã này`
        )
      );
    }

    // check số lần dùng tối đa (nếu có)
    if (
      typeof coupon.maxUses === 'number' &&
      coupon.maxUses > 0 &&
      coupon.timesUsed >= coupon.maxUses
    ) {
      return next(errorHandler(400, 'Mã giảm giá đã dùng hết lượt cho phép'));
    }

    // ===== TÍNH GIÁ TRỊ GIẢM =====
    let discount = 0;
    const type = coupon.type; // 'percent' | 'amount'
    const value = Number(coupon.value) || 0;

    if (type === 'percent') {
      discount = Math.round((amount * value) / 100);
      if (
        typeof coupon.maxDiscount === 'number' &&
        coupon.maxDiscount > 0 &&
        discount > coupon.maxDiscount
      ) {
        discount = coupon.maxDiscount;
      }
    } else if (type === 'amount') {
      discount = value;
    }

    if (discount < 0) discount = 0;
    if (discount > amount) discount = amount;

    const finalAmount = amount - discount;

    return res.status(200).json({
      success: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
      },
      discountAmount: discount,
      finalAmount,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      code,
      type,             // 'percent' | 'amount'
      value,            // số %
      minOrderAmount,   // đơn tối thiểu
      expiresAt,
      isActive,
    } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return next(errorHandler(404, 'Coupon không tồn tại'));
    }

    coupon.code = code?.trim().toUpperCase() || coupon.code;
    coupon.type = type || coupon.type;
    coupon.value = value ?? coupon.value;
    coupon.minOrderAmount =
      minOrderAmount !== undefined ? minOrderAmount : coupon.minOrderAmount;
    coupon.expiresAt = expiresAt || coupon.expiresAt;
    coupon.isActive = typeof isActive === 'boolean' ? isActive : coupon.isActive;

    await coupon.save();

    return res.status(200).json(coupon);
  } catch (err) {
    next(err);
  }
};
