import express from "express";
import { 
  test,
  updateUser,
  deleteUser,
  getUserListings,
  getUser,
  purchaseCredits,      // 👈 thêm
} from "../controllers/user.controller.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

router.get('/test', test);
router.post('/update/:id', verifyToken, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);
router.get('/listings/:id', verifyToken, getUserListings);
router.get('/:id', verifyToken, getUser);

// ====== MUA GÓI TIN (fake payment) ======
router.post('/credits/purchase', verifyToken, purchaseCredits);

export default router;
