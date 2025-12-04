import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    // 'percent' = giảm theo %, 'amount' = giảm theo số tiền
    type: {
      type: String,
      enum: ['percent', 'amount'],
      required: true,
    },
    // nếu type = 'percent' => value = 10 nghĩa là -10%
    // nếu type = 'amount'  => value = 50000 nghĩa là -50,000đ
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    // Đơn tối thiểu để được áp dụng mã
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Ngày hết hạn (optional)
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Ai tạo (admin)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);
