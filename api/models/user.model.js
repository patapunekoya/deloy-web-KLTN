// api/models/user.model.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: 'https://cdn-icons-png.flaticon.com/512/219/219983.png',
    },
    isAdmin: { type: Boolean, default: false },

    phone: {
      type: String,
      trim: true,
      default: '',
    },

    // ====== QUẢN LÝ GÓI TIN ======
    vipCredits: { type: Number, default: 0 },
    premiumCredits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
