// api/utils/creditsConfig.js

// giống đúng fallback trong Pricing.jsx cho nó đồng bộ
export const CREDIT_PACKAGES = [
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
];

// demo coupon, muốn đổi thì đổi ở đây
export const COUPONS = [
  {
    code: 'HS10',
    type: 'percent',
    value: 10,
    minOrderAmount: 100000,
    maxDiscount: 100000,
    description: 'Giảm 10%, tối đa 100K cho đơn từ 100K',
  },
  {
    code: 'HS50K',
    type: 'fixed',
    value: 50000,
    minOrderAmount: 200000,
    description: 'Giảm 50K cho đơn từ 200K',
  },
];

export function findCreditPackage(key) {
  return CREDIT_PACKAGES.find((p) => p.key === key) || null;
}

export function calculateCoupon(code, orderAmount) {
  const normalizedCode = (code || '').toUpperCase().trim();
  const amount = Number(orderAmount) || 0;

  if (!normalizedCode) {
    throw new Error('Mã giảm giá không hợp lệ');
  }
  if (amount <= 0) {
    throw new Error('Tổng tiền đơn hàng không hợp lệ');
  }

  const coupon = COUPONS.find((c) => c.code === normalizedCode);
  if (!coupon) {
    throw new Error('Mã giảm giá không tồn tại');
  }

  if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
    throw new Error(
      `Đơn tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ để dùng mã này`
    );
  }

  let discount = 0;

  if (coupon.type === 'percent') {
    discount = Math.round((amount * coupon.value) / 100);
    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else if (coupon.type === 'fixed') {
    discount = coupon.value;
  }

  if (discount < 0) discount = 0;
  if (discount > amount) discount = amount;

  const finalAmount = amount - discount;

  return {
    coupon,
    discountAmount: discount,
    finalAmount,
  };
}
