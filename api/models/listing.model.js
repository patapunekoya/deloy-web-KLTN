// api/models/listing.model.js
import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    // Cơ bản
    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    // Địa chỉ chi tiết
    province: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    ward: {
      type: String,
      trim: true,
    },
    houseNumber: {
      type: String,
      trim: true,
    },

    // Địa chỉ full để hiển thị / search
    address: {
      type: String,
      required: true,
    },

    // Giá
    regularPrice: {
      type: Number,
      default: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    priceDisplay: {
    type: String,
    trim: true,
    default: '',
   },
   
    priceContact: {
    type: Boolean,
    default: false,
    },

    // Phòng
    bathrooms: {
      type: Number,
      required: true,
    },
    bedrooms: {
      type: Number,
      required: true,
    },

    furnished: {
      type: Boolean,
      required: true,
    },
    parking: {
      type: Boolean,
      required: true,
    },

    type: {
      type: String, // 'rent' | 'sale'
      required: true,
    },

    offer: {
      type: Boolean,
      required: true,
    },

    // Loại tin: thường / VIP / Premium
    listingType: {
      type: String,
      enum: ['normal', 'vip', 'premium'],
      default: 'normal',
    },

    // Trạng thái duyệt
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    // Ngày hết hạn hiển thị
    expiresAt: {
      type: Date,
    },

    // Chi tiết thêm
    area: {
      type: Number, // m2
      required: true,
    },

    legalStatus: {
      type: String, // Sổ hồng / Sổ đỏ / HĐMB ...
      required: true,
      trim: true,
    },

    direction: {
      type: String,
      trim: true,
    },

    alleyWidth: {
      type: Number,
    },

    width: {
      type: Number,
    },

    length: {
      type: Number,
    },

    floors: {
      type: Number,
    },

    toilets: {
      type: Number,
    },

    landPrice: {
      type: Number, // giá đất /m2 nếu có
    },

    // Thông tin liên hệ
    contactName: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactZalo: {
      type: String,
      trim: true,
    },
    contactAvatar: {
      type: String, // url ảnh
      default: '',
    },
    // Ưu tiên hiển thị
    priority: {
      type: Number,
      default: 1, // normal = 1, vip = 2, premium = 3 (tùy logic sort phía trên)
    },

    // Ảnh
    imageUrls: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0 && arr.length <= 30;
        },
        message: 'Mỗi tin chỉ được phép có từ 1 đến 30 ảnh.',
      },
    },

    // ref user
    userRef: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
