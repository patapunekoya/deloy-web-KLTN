import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
const port = Number(process.env.EMAIL_PORT) || 465;
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || `"HouseSale" <${user}>`;

if (!user || !pass) {
  throw new Error('EMAIL_USER hoặc EMAIL_PASS không tồn tại. Kiểm tra api/.env và khởi động lại server.');
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

export async function sendMail({ to, subject, html, text }) {
  await transporter.verify();
  return transporter.sendMail({ from, to, subject, text, html });
}
