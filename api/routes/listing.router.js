import express from "express";
import {
  createListing,
  getListing,
  deleteListing,
  updateListing,
  getListings,
  getListingForEdit,  
  getListingsByUser,  // 👈 thêm
} from "../controllers/listing.controller.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

router.post("/create", verifyToken, createListing);

// Public xem chi tiết (chỉ thấy approved)
router.get("/get/:id", getListing);

// Lấy thông tin để EDIT (cần login & đúng owner/admin)
router.get("/edit/:id", verifyToken, getListingForEdit);
router.get("/by-user/:userId", getListingsByUser); 
router.delete("/delete/:id", verifyToken, deleteListing);
router.post("/update/:id", verifyToken, updateListing);
router.get("/get", getListings);

export default router;

