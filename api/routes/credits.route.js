// api/routes/credits.route.js
import express from 'express';
import { verifyToken, verifyAdmin } from '../utils/verifyUser.js';
import {
  getPackages,
  confirmPackagePurchase,
  adminListOrders,
  createPayOSOrder,
  handlePayOSWebhook,
  confirmPayOSFromReturnUrl,
  getUserHistory,
} from '../controllers/credits.controller.js';

const router = express.Router();

// Lấy danh sách gói tin
router.get('/packages', getPackages);

// Fake confirm nếu còn dùng
router.post('/confirm', verifyToken, confirmPackagePurchase);

// Tạo link thanh toán PayOS
router.post('/create-order', verifyToken, createPayOSOrder);

// Webhook PayOS (không auth)
router.post('/webhook/payos', handlePayOSWebhook);

// FE PaymentSuccess gọi để confirm
router.post('/confirm-payos', verifyToken, confirmPayOSFromReturnUrl);

// Admin xem đơn
router.get('/admin/orders', verifyToken, verifyAdmin, adminListOrders);

// Lịch sử nạp credit của user
router.get('/history', verifyToken, getUserHistory);

export default router;
