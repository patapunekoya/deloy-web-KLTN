import express from 'express';
import {
  getCoupons,
  upsertCoupon,
  deleteCoupon,
  updateCoupon,
  validateCoupon,
} from '../controllers/coupon.controller.js';
import { verifyToken, verifyAdmin } from '../utils/verifyUser.js';

const router = express.Router();

// Admin quản lý coupon
router.get('/', verifyToken, verifyAdmin, getCoupons);
router.post('/', verifyToken, verifyAdmin, upsertCoupon);
router.delete('/:id', verifyToken, verifyAdmin, deleteCoupon);
router.put('/:id', verifyToken, verifyAdmin, updateCoupon);

// Validate mã ở phía checkout (user thường dùng được)
router.post('/validate', verifyToken, validateCoupon);

export default router;
