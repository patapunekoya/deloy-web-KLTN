import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Lấy thông tin từ Env
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || `"HouseSale Support" <${user}>`;

if (!user || !pass) {
  console.warn('⚠️ [MAILER] Thiếu EMAIL_USER/PASS.');
}

// --- THAY ĐỔI Ở ĐÂY: Dùng Port 587 ---
const transporter = nodemailer.createTransport({
  service: 'gmail', // Dùng service 'gmail' để nó tự cấu hình host/port chuẩn nhất
  auth: {
    user,
    pass,
  },
  // Các tùy chọn giúp debug và tránh timeout
  logger: true, 
  debug: true, 
});

export async function sendMail({ to, subject, html, text }) {
  try {
    console.log(`[MAILER] Đang gửi đến: ${to}...`);
    
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ [MAILER] Thành công: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ [MAILER] Lỗi chi tiết:', error);
    throw error;
  }
}