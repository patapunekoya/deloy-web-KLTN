// api/index.js
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import userRoute from './routes/user.route.js';
import authRoute from './routes/auth.route.js';
import listingRoute from './routes/listing.router.js';
import priceRoute from './routes/price.route.js';
import newsletterRoute from './routes/newsletter.route.js';
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

app.use(
  cors({
    origin: 'http://localhost:5173', // Local dev (trên Render nó sẽ gọi cùng domain nên không lo)
    credentials: true,
  })
);

// PayOS webhook dùng JSON body
app.use(express.json());
app.use(cookieParser());

// --- API ROUTES ---
app.use('/api/newsletter', newsletterRoute);
app.use('/api/user', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/listing', listingRoute);
app.use('/api/price', priceRoute);
app.use('/api/admin', adminRoute);
app.use('/api/credits', creditsRoute);
app.use('/api/coupons', couponRoute); // Đã xóa dòng lặp /api/admin/coupons

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'dev',
    uptime: process.uptime(),
  });
});

// --- CẤU HÌNH PHỤC VỤ FRONTEND (DEPLOY) ---
// Khi deploy bằng Docker, ta sẽ build frontend vào thư mục frontend/dist
// Folder api nằm ngang hàng folder frontend trong container
const buildPath = path.join(__dirname, '../frontend/dist');

// Phục vụ các file tĩnh (JS, CSS, ảnh)
app.use(express.static(buildPath));

// Mọi đường dẫn không phải API sẽ trả về index.html để React Router xử lý
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// --- MIDDLEWARE XỬ LÝ LỖI (Đặt cuối cùng) ---
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(`[ERROR] ${statusCode}: ${message}`);

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

const PORT = Number(process.env.PORT) || 3000;
// Dùng app.listen thay vì server.listen vì không còn socket.io
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});