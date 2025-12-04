import express from "express";
import axios from "axios";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

router.post("/predict", verifyToken, async (req, res, next) => {
  try {
    // 1. Lấy URL từ biến môi trường (đã cấu hình trên Render)
    // Nếu chạy local thì dùng localhost, nếu lên web thì dùng link https
    const aiUrl = process.env.AI_API_URL || "http://localhost:8001/predict";
    
    console.log(`[AI] Calling predict service at: ${aiUrl}`);

    // 2. Gọi sang Python với timeout 60s (để chờ Cold Start)
    const resp = await axios.post(aiUrl, {
      features: req.body.features // <--- SỬA: Phải dùng key "features" mới đúng
    }, { 
      timeout: 60000 // 60 giây
    });
    
    return res.json(resp.data);
  } catch (err) {
    console.error("[AI Error]", err.message);
    
    // Lấy chi tiết lỗi từ Python trả về (nếu có)
    const detail = err.response?.data?.detail || err.message;
    return res.status(400).json({ success: false, detail });
  }
});

export default router;