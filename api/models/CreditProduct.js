// Web_HouseSale/api/models/CreditProduct.js
import mongoose from 'mongoose';

const creditProductSchema = new mongoose.Schema(
  {
    // key nội bộ, dùng map với FE: 'vip_single', 'premium_single', 'combo_trial',...
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Tên hiển thị cho người dùng: "1 tin VIP", "Combo trải nghiệm (5 tin VIP)", ...
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Mô tả chi tiết để show trên UI (optional)
    description: {
      type: String,
      default: '',
    },

    // Số credits nhận được khi mua 1 đơn vị sản phẩm
    vipCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    premiumCredits: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Giá VND cho *một đơn vị* sản phẩm
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Loại: 'single' (tin lẻ) hoặc 'combo'
    productType: {
      type: String,
      enum: ['single', 'combo'],
      required: true,
    },

    // Có đang mở bán hay không
    isActive: {
      type: Boolean,
      default: true,
    },

    // Thứ tự sắp xếp trên UI (nhỏ hơn đứng trước)
    sortOrder: {
      type: Number,
      default: 0,
    },

    // Cho phép admin gắn tag nếu cần (ví dụ: 'best_seller', 'recommend')
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const CreditProduct = mongoose.model('CreditProduct', creditProductSchema);

export default CreditProduct;
