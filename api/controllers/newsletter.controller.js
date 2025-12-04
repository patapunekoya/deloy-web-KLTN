import Subscriber from '../models/Subscriber.js';
import { sendMail } from '../utils/mailer.js';
import { signToken, verifyToken } from '../utils/token.js';

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
}

export const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!isEmail(email)) return res.status(400).json({ success: false, message: 'Email không hợp lệ' });

    const base = `${req.protocol}://${req.get('host')}`;
    const token = signToken({ email, a: 'confirm' }, '2d');
    const confirmUrl = `${base}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

    let doc = await Subscriber.findOne({ email });
    if (!doc) {
      doc = await Subscriber.create({ email, status: 'pending' });
    } else if (doc.status === 'confirmed') {
      return res.json({ success: true, message: 'Email đã đăng ký trước đó.' });
    } else {
      await Subscriber.updateOne({ email }, { $set: { status: 'pending', unsubscribedAt: null } });
    }

    await sendMail({
      to: email,
      subject: 'Xác nhận đăng ký bản tin HouseSale',
      text: `Cảm ơn bạn đã đăng ký HouseSale. Nhấn vào liên kết sau để xác nhận: ${confirmUrl}`,
      html: `
        <div style="font-family:system-ui;max-width:560px;margin:auto;padding:16px">
          <h2 style="margin:0 0 8px;color:#111827">Xác nhận đăng ký</h2>
          <p style="margin:8px 0;color:#374151">Cảm ơn bạn đã đăng ký nhận bản tin <b>HouseSale</b>.</p>
          <p style="margin:12px 0">
            👉 <a href="${confirmUrl}" target="_blank" style="color:#2563eb;font-weight:600;text-decoration:none">
              Click vào đây để xác nhận đăng ký bản tin HouseSale
            </a>
          </p>
          <p style="margin:8px 0;color:#6b7280;font-size:13px">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        </div>
      `
    });

    return res.json({ success: true, message: 'Đã gửi email xác nhận. Vui lòng kiểm tra hộp thư.' });
  } catch (err) { next(err); }
};

export const confirm = async (req, res, next) => {
  try {
    const { token } = req.query;
    const payload = verifyToken(token);
    if (payload?.a !== 'confirm' || !isEmail(payload?.email)) throw new Error('Token không hợp lệ');

    const updated = await Subscriber.findOneAndUpdate(
      { email: payload.email },
      { $set: { status: 'confirmed', confirmedAt: new Date(), unsubscribedAt: null } },
      { new: true }
    );

    if (!updated) throw new Error('Email không tồn tại');

    const unsubToken = signToken({ email: updated.email, a: 'unsub' }, '30d');
    const base = `${req.protocol}://${req.get('host')}`;
    const unsubUrl = `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubToken)}`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.send(`
      <div style="font-family:system-ui;max-width:560px;margin:40px auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="margin:0 0 12px;color:#111827">Xác nhận thành công</h2>
        <p style="margin:8px 0;color:#374151">Bạn đã đăng ký nhận bản tin <b>HouseSale</b>.</p>
        <p style="margin:8px 0;color:#6b7280">Nếu sau này muốn hủy, hãy:</p>
        <p>
          👉 <a href="${unsubUrl}" target="_blank" style="color:#2563eb;font-weight:600;text-decoration:none">
            Click vào đây để hủy đăng ký
          </a>
        </p>
      </div>
    `);
  } catch (err) { next(err); }
};

export const unsubscribe = async (req, res, next) => {
  try {
    const { token } = req.query;
    const payload = verifyToken(token);
    if (payload?.a !== 'unsub' || !isEmail(payload?.email)) throw new Error('Token không hợp lệ');

    const updated = await Subscriber.findOneAndUpdate(
      { email: payload.email },
      { $set: { status: 'pending', unsubscribedAt: new Date() } },
      { new: true }
    );

    if (!updated) throw new Error('Email không tồn tại');

    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.send(`
      <div style="font-family:system-ui;max-width:560px;margin:40px auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="margin:0 0 12px;color:#111827">Đã hủy đăng ký</h2>
        <p style="margin:8px 0;color:#374151">Bạn sẽ không còn nhận email từ HouseSale.</p>
      </div>
    `);
  } catch (err) { next(err); }
};
