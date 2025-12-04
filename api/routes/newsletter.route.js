import express from 'express';
import { subscribe, confirm, unsubscribe } from '../controllers/newsletter.controller.js';

const router = express.Router();
router.post('/subscribe', subscribe);
router.get('/confirm', confirm);
router.get('/unsubscribe', unsubscribe);

export default router;
