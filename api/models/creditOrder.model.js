// api/models/creditOrder.model.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    packageKey: { type: String, required: true },
    label: { type: String, required: true },

    vipCredits: { type: Number, default: 0 },
    premiumCredits: { type: Number, default: 0 },

    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
    },

    couponCode: {
      type: String,
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending', // với PayOS phải pending trước
    },

    paymentMethod: {
      type: String,
      default: 'payos', // hoặc 'qr_fake' nếu fake
    },

    note: {
      type: String,
    },

    // ==== PAYOS FIELDS ====
    // orderCode bên PayOS (số)
    payosOrderCode: {
      type: Number,
      index: true,
    },

    // raw status từ PayOS: PENDING / PAID / CANCELLED / EXPIRED ...
    payosStatus: {
      type: String,
    },

    payosRaw: {
      type: Object,
    },

    // tránh cộng credits 2 lần
    isCreditsApplied: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const CreditOrder = mongoose.model('CreditOrder', orderSchema);

export default CreditOrder;
