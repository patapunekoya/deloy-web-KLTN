import express from "express";
import axios from "axios";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

// (tuỳ) yêu cầu đăng nhập mới được dự đoán
router.post("/predict", verifyToken, async (req, res, next) => {
  try {
    // req.body.data: object features
    const resp = await axios.post("http://localhost:8001/predict", {
      data: req.body.data
    }, { timeout: 5000 });
    return res.json(resp.data);
  } catch (err) {
    const detail = err.response?.data || err.message;
    return res.status(400).json({ success: false, detail });
  }
});

export default router;
