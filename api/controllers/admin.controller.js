import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import Subscriber from '../models/Subscriber.js'; // 👈 Import Subscriber để check confirm
import { errorHandler } from '../utils/error.js';
import { sendMail } from '../utils/mailer.js';    // 👈 Import mailer
import CreditOrder from '../models/creditOrder.model.js';

// ===== USERS =====
export const adminListUsers = async (req,res,next) => {
  try {
    const { page=1, limit=10, search='' } = req.query;
    const q = search
      ? { $or: [
          { username: { $regex: search, $options: 'i' } },
          { email:    { $regex: search, $options: 'i' } }
        ]}
      : {};
    const skip = (Number(page)-1)*Number(limit);
    const [items, total] = await Promise.all([
      User.find(q).select('-password').sort({createdAt:-1}).skip(skip).limit(Number(limit)),
      User.countDocuments(q)
    ]);
    res.json({ items, total, page:Number(page), limit:Number(limit) });
  } catch(e){ next(e); }
};

export const adminUpdateUser = async (req,res,next) => {
  try {
    const { id } = req.params;
    // Cho phép update: username, email, isAdmin, avatar
    const allowed = ['username','email','isAdmin','avatar'];
    const $set = {};
    for (const k of allowed) if (k in req.body) $set[k] = req.body[k];

    const doc = await User.findByIdAndUpdate(id, { $set }, { new:true }).select('-password');
    if (!doc) return next(errorHandler(404,'User not found'));
    res.json(doc);
  } catch(e){ next(e); }
};

export const adminDeleteUser = async (req,res,next) => {
  try {
    const { id } = req.params;
    // Xoá user + các listing thuộc user đó
    await Promise.all([
      User.findByIdAndDelete(id),
      Listing.deleteMany({ userRef: id })
    ]);
    res.json({ success:true });
  } catch(e){ next(e); }
};

// ===== LISTINGS =====
export const adminListListings = async (req,res,next) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;

    const q = {};

    if (search) {
      q.name = { $regex: search, $options: 'i' };
    }

    // filter theo trạng thái nếu có
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      q.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Listing.find(q)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Listing.countDocuments(q),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (e) {
    next(e);
  }
};

// === CẬP NHẬT TRẠNG THÁI & GỬI MAIL ===
export const adminUpdateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, ...otherUpdates } = req.body;

    // 1. Tạo query tìm kiếm
    // Nếu Admin muốn đổi status, ta bắt buộc tin đó phải đang là 'pending' mới cho sửa
    // (Để tránh 2 admin cùng thao tác)
    const query = { _id: id };
    if (status) {
        query.status = 'pending'; 
    }

    // 2. Thực hiện update
    const doc = await Listing.findOneAndUpdate(
        query, 
        { $set: req.body }, 
        { new: true }
    );

    // 3. Xử lý kết quả
    if (!doc) {
        // Trường hợp này xảy ra khi:
        // - Tin không tồn tại
        // - HOẶC tin đã bị người khác đổi status rồi (không còn là pending nữa)
        return next(errorHandler(409, 'Tin này đã được xử lý bởi Admin khác! Vui lòng tải lại trang.'));
    }
    // --- LOGIC GỬI MAIL THÔNG BÁO ---
    // Chỉ gửi khi có status được gửi lên và là 'approved' hoặc 'rejected'
    if (req.body.status && ['approved', 'rejected'].includes(req.body.status)) {
        try {
            // Tìm thông tin chủ nhà
            const owner = await User.findById(doc.userRef);
            
            if (owner && owner.email) {
                // 🔥 CHECK QUAN TRỌNG: Chỉ gửi nếu email này đã Confirm trong bảng Subscriber
                const isConfirmed = await Subscriber.findOne({ 
                    email: owner.email, 
                    status: 'confirmed' 
                });

                if (isConfirmed) {
                    const isApproved = req.body.status === 'approved';
                    const subject = isApproved 
                        ? '🎉 Tin đăng của bạn đã được duyệt!' 
                        : '⚠️ Tin đăng của bạn bị từ chối';
                    
                    const text = `Xin chào ${owner.username},\n\nTin đăng "${doc.name}" của bạn đã được Admin chuyển sang trạng thái: ${req.body.status.toUpperCase()}.\n\nVui lòng truy cập website để kiểm tra chi tiết.`;
                    
                    const html = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                            <div style="background-color: ${isApproved ? '#10b981' : '#ef4444'}; padding: 20px; text-align: center; color: white;">
                                <h2 style="margin: 0;">${isApproved ? 'TIN ĐÃ ĐƯỢC DUYỆT' : 'TIN BỊ TỪ CHỐI'}</h2>
                            </div>
                            <div style="padding: 24px;">
                                <p>Xin chào <b>${owner.username}</b>,</p>
                                <p>Trạng thái tin đăng bất động sản của bạn vừa được cập nhật.</p>
                                
                                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">TIÊU ĐỀ TIN</p>
                                    <p style="margin: 0; font-weight: 600; color: #111827;">${doc.name}</p>
                                </div>

                                <p>Trạng thái mới: <b style="color: ${isApproved ? '#059669' : '#dc2626'}">${req.body.status.toUpperCase()}</b></p>
                                
                                <p style="margin-top: 24px;">
                                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile" style="display: inline-block; background-color: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                        Quản lý tin đăng
                                    </a>
                                </p>
                            </div>
                        </div>
                    `;

                    // Gửi mail (bất đồng bộ, không await để tránh làm chậm response)
                    sendMail({ to: owner.email, subject, text, html })
                        .then(() => console.log(`[MAIL] Sent notification to ${owner.email}`))
                        .catch(err => console.error('[MAIL] Failed:', err.message));
                } else {
                    console.log(`[MAIL] User ${owner.email} chưa confirm subscriber, bỏ qua gửi mail.`);
                }
            }
        } catch (mailErr) {
            console.error('[MAIL] Logic error:', mailErr);
        }
    }
    // --------------------------------

    res.json(doc);
  } catch(e){ next(e); }
};

export const adminDeleteListing = async (req,res,next) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.json({ success:true });
  } catch(e){ next(e); }
};


// ===== STATS (THỐNG KÊ DASHBOARD) =====
export const getAdminStats = async (req, res, next) => {
  try {
    // 1. Lấy các chỉ số tổng quan (giữ nguyên)
    const totalUsers = await User.countDocuments();
    const totalListings = await Listing.countDocuments();
    const totalOrders = await CreditOrder.countDocuments({ status: 'paid' });

    // 2. Tính tổng doanh thu toàn thời gian
    const revenueAgg = await CreditOrder.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // 3. LOGIC MỚI: Lấy doanh thu theo 6 tháng gần nhất
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Lấy từ 5 tháng trước + tháng này
    sixMonthsAgo.setDate(1); // Bắt đầu từ ngày mùng 1

    const monthlyStats = await CreditOrder.aggregate([
      { 
        $match: { 
          status: 'paid',
          createdAt: { $gte: sixMonthsAgo } // Chỉ lấy đơn từ 6 tháng đổ lại
        } 
      },
      {
        $group: {
          _id: { 
            month: { $month: "$createdAt" }, 
            year: { $year: "$createdAt" } 
          },
          total: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } } // Sắp xếp thời gian tăng dần
    ]);

    // Format dữ liệu cho Frontend dễ vẽ biểu đồ (VD: "T8/2023")
    const chartData = monthlyStats.map(item => ({
      name: `T${item._id.month}/${item._id.year}`,
      DoanhThu: item.total
    }));

    // 4. Lấy 5 đơn hàng mới nhất
    const recentOrders = await CreditOrder.find({ status: 'paid' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username email');

    res.status(200).json({
      totalUsers,
      totalListings,
      totalOrders,
      totalRevenue,
      chartData, // <--- Dữ liệu biểu đồ
      recentOrders
    });
  } catch (error) {
    next(error);
  }
};