import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load biến môi trường (Dùng cho local, trên Render nó sẽ tự nhận từ Dashboard)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
const port = Number(process.env.EMAIL_PORT) || 465;
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || `"HouseSale Support" <${user}>`;

// Kiểm tra cấu hình (Chỉ log cảnh báo thay vì Crash app)
if (!user || !pass) {
  console.warn('⚠️ [MAILER] Thiếu EMAIL_USER hoặc EMAIL_PASS. Tính năng gửi mail sẽ không hoạt động.');
}

// Cấu hình Transporter
const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // true nếu dùng 465, false nếu dùng 587
  auth: {
    user,
    pass,
  },
  // Quan trọng: Giúp tránh lỗi "Self-signed certificate" trên Render/Cloud
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendMail({ to, subject, html, text }) {
  try {
    // Kiểm tra kỹ trước khi gửi
    if (!user || !pass) {
      throw new Error('Chưa cấu hình Email hệ thống.');
    }

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ [MAILER] Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ [MAILER] Failed:', error.message);
    // Ném lỗi ra để Controller biết mà báo về Frontend
    throw error; 
  }
}