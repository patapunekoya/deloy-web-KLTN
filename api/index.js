// api/index.js
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoute from './routes/user.route.js';
import authRoute from './routes/auth.route.js';
import listingRoute from './routes/listing.router.js';
import priceRoute from './routes/price.route.js';
import newsletterRoute from './routes/newsletter.route.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import adminRoute from './routes/admin.route.js';
import creditsRoute from './routes/credits.route.js';
import couponRoute from './routes/coupon.route.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, './.env') });

if (!process.env.MONGO) {
  console.error('❌ MISSING MONGO CONNECTION STRING IN .env');
  process.exit(1);
}

console.log('[API] Connecting to MongoDB...');
await mongoose.connect(process.env.MONGO);
console.log('✅ Connected to MongoDB');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

// PayOS webhook dùng JSON body nên để express.json là đủ
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/newsletter', newsletterRoute);
app.use('/api/user', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/listing', listingRoute);
app.use('/api/price', priceRoute);
app.use('/api/admin', adminRoute);
app.use('/api/credits', creditsRoute);
app.use('/api/admin/coupons', couponRoute);
app.use('/api/coupons', couponRoute);


// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'dev',
    uptime: process.uptime(),
  });
});

// --- MIDDLEWARE XỬ LÝ LỖI (QUAN TRỌNG: Phải đặt cuối cùng) ---
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(`[ERROR] ${statusCode}: ${message}`); // Log ra console để debug

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});



const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
