// api/controllers/user.controller.js
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

export const test = (req, res) => {
  res.json({ message: 'appi ' });
};

// ================ UPDATE USER ================
export const updateUser = async (req, res, next) => {
  // chỉ cho update chính mình
  if (req.user.id !== req.params.id) {
    return next(
      errorHandler(401, 'bạn chỉ có thể update tài khoản mà bạn sở hữu!')
    );
  }

  try {
    const updateFields = {};

    // các field cơ bản
    if (typeof req.body.username === 'string') {
      updateFields.username = req.body.username;
    }
    if (typeof req.body.email === 'string') {
      updateFields.email = req.body.email;
    }
    if (typeof req.body.avatar === 'string') {
      updateFields.avatar = req.body.avatar;
    }
    if (typeof req.body.phone === 'string') {
      updateFields.phone = req.body.phone.trim();
    }

    // nếu có password mới thì mới hash & set
    if (req.body.password && req.body.password.trim()) {
      const hashed = bcrypt.hashSync(req.body.password.trim(), 10);
      updateFields.password = hashed;
    }

    // 1. CẬP NHẬT USER
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return next(errorHandler(404, 'Không tìm thấy tài khoản!'));
    }

    // =========================================================
    // 2. ĐỒNG BỘ THÔNG TIN SANG TẤT CẢ LISTING CỦA USER NÀY
    // (Fix lỗi Avatar/Name cũ trên Card)
    // =========================================================
    // Chỉ chạy nếu có thay đổi avatar, username hoặc số điện thoại
    if (updateFields.avatar || updateFields.username || updateFields.phone) {
      const listingUpdates = {};
      
      if (updateFields.avatar) listingUpdates.contactAvatar = updateFields.avatar;
      if (updateFields.username) listingUpdates.contactName = updateFields.username;
      
      // Nếu đổi số điện thoại, cập nhật luôn Zalo (nếu logic của bạn là Zalo = Phone)
      if (updateFields.phone) {
         listingUpdates.contactPhone = updateFields.phone;
         listingUpdates.contactZalo = updateFields.phone; 
      }

      // Tìm tất cả tin có userRef khớp và update
      await Listing.updateMany(
        { userRef: req.params.id }, 
        { $set: listingUpdates }    
      );
    }
    // =========================================================

    const { password, ...rest } = updatedUser._doc;
    return res.status(200).json({ rest });
  } catch (error) {
    next(error);
  }
};

// ================ DELETE USER ================
export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(
      errorHandler(401, 'Bạn chỉ có thể xóa tài khoản của mình!')
    );
  }
  try {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie('access_token');
    res
      .status(200)
      .json({ message: 'Tài khoản đã được xóa thành công' });
  } catch (error) {
    next(error);
  }
};

// ================ USER LISTINGS ================
export const getUserListings = async (req, res, next) => {
  if (req.user.id === req.params.id) {
    try {
      const listings = await Listing.find({ userRef: req.params.id });
      res.status(200).json(listings);
    } catch (error) {
      next(error);
    }
  } else {
    return next(
      errorHandler(401, 'Bạn chỉ có thể xem bài đăng của mình!')
    );
  }
};

// ================ GET USER ================
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return next(errorHandler(404, 'Không tìm thấy tài khoản!'));

    const { password: pass, ...rest } = user._doc;

    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

// ================ MUA GÓI TIN (BẢN CŨ CỦA ÔNG) ================
export const purchaseCredits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { packageType } = req.body;

    if (!packageType) {
      return next(errorHandler(400, 'Thiếu loại gói (packageType)'));
    }

    let vipAdd = 0;
    let premiumAdd = 0;

    // mapping theo plan bạn đưa
    switch (packageType) {
      // Mua tin lẻ
      case 'single_vip':
        vipAdd = 1;
        break;
      case 'single_premium':
        premiumAdd = 1;
        break;

      // Combo
      case 'combo_trial': // combo trải nghiệm (5 tin VIP) 99k
        vipAdd = 5;
        break;
      case 'combo_boost': // combo tăng tốc (3 premium, 10 VIP) 399k
        vipAdd = 10;
        premiumAdd = 3;
        break;
      case 'combo_leader': // combo dẫn đầu (10 premium, 20 VIP) 999k
        vipAdd = 20;
        premiumAdd = 10;
        break;

      default:
        return next(errorHandler(400, 'Loại gói không hợp lệ'));
    }

    const user = await User.findById(userId);
    if (!user) return next(errorHandler(404, 'Không tìm thấy tài khoản!'));

    user.vipCredits = (user.vipCredits || 0) + vipAdd;
    user.premiumCredits = (user.premiumCredits || 0) + premiumAdd;

    await user.save();

    const { password, ...rest } = user._doc;
    return res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};