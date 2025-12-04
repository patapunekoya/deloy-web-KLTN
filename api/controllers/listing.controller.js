// api/controllers/listing.controller.js
import Listing from "../models/listing.model.js";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";

// Helper: map listingType -> priority + số ngày hiển thị
const getListingTypeConfig = (listingTypeRaw) => {
  const t = (listingTypeRaw || "normal").toLowerCase();

  switch (t) {
    case "vip":
      return { listingType: "vip", priority: 2, days: 200 };
    case "premium":
      return { listingType: "premium", priority: 3, days: 365 };
    default:
      return { listingType: "normal", priority: 1, days: 150 };
  }
};

// ========== TẠO LISTING ==========
export const createListing = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(errorHandler(401, "Unauthorized"));
    }

    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    // Xác định loại tin + priority + thời gian hiển thị
    const { listingType, priority, days } = getListingTypeConfig(
      req.body.listingType
    );

    // Nếu tin VIP / Premium mà user chưa có phone => chặn
    if ((listingType === "vip" || listingType === "premium") && !user.phone) {
      return next(
        errorHandler(
          400,
          "Bạn cần cập nhật số điện thoại trong hồ sơ trước khi đăng tin VIP/Premium."
        )
      );
    }

    // Kiểm tra quota & TRỪ CREDITS cho VIP / Premium
    if (listingType === "vip") {
      if (!user.vipCredits || user.vipCredits <= 0) {
        return next(
          errorHandler(
            400,
            "Bạn không còn lượt đăng tin VIP. Vui lòng mua gói tin."
          )
        );
      }
      user.vipCredits -= 1;
    } else if (listingType === "premium") {
      if (!user.premiumCredits || user.premiumCredits <= 0) {
        return next(
          errorHandler(
            400,
            "Bạn không còn lượt đăng tin Premium. Vui lòng mua gói tin."
          )
        );
      }
      user.premiumCredits -= 1;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Payload gốc
    const payload = {
      ...req.body,
      userRef: userId,
      listingType,
      status: "pending",
      priority,
      expiresAt,
    };

    // Không cho client override field hệ thống
    delete payload.status;
    delete payload.priority;
    delete payload.expiresAt;
    delete payload.userRef;
    delete payload.listingType;

    payload.userRef = userId;
    payload.listingType = listingType;
    payload.status = "pending";
    payload.priority = priority;
    payload.expiresAt = expiresAt;

    // GÁN THÔNG TIN LIÊN HỆ (KÈM AVATAR) TỪ USER
    payload.contactName =
      req.body.contactName || user.username || "";
    payload.contactPhone =
      req.body.contactPhone || user.phone || "";
    payload.contactEmail =
      req.body.contactEmail || user.email || "";
    payload.contactZalo =
      req.body.contactZalo || user.phone || "";
    payload.contactAvatar =
      req.body.contactAvatar || user.avatar || "";

    const listing = await Listing.create(payload);
    await user.save(); // lưu quota mới

    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

// ========== LẤY CHI TIẾT LISTING (CẬP NHẬT QUYỀN XEM CHO ADMIN) ==========
export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, "Listing not found!"));
    }

    const now = new Date();
    
    // 1. Nếu tin ĐÃ DUYỆT và CÒN HẠN -> Ai cũng xem được (Public)
    const isPublic =
      listing.status === "approved" &&
      (!listing.expiresAt || listing.expiresAt > now);

    if (isPublic) {
      return res.status(200).json(listing);
    }

    // 2. Nếu tin CHƯA DUYỆT hoặc HẾT HẠN -> Check quyền Admin/Owner
    const token = req.cookies.access_token;
    if (!token) {
      // Khách vãng lai không thấy tin này
      return next(errorHandler(404, "Listing not found"));
    }

    // Verify token để xem ai đang request
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return next(errorHandler(404, "Listing not found"));
      }

      try {
        const user = await User.findById(decoded.id);
        
        // Nếu là Admin HOẶC là Chủ bài đăng -> Cho phép xem
        if (user && (user.isAdmin || listing.userRef === user._id.toString())) {
          return res.status(200).json(listing);
        } else {
          return next(errorHandler(404, "Listing not found"));
        }
      } catch (error) {
        return next(error);
      }
    });

  } catch (error) {
    next(error);
  }
};

// ========== LẤY LISTING ĐỂ EDIT (OWNER / ADMIN) ==========
export const getListingForEdit = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, "Listing not found"));
    }

    // route này bắt buộc phải đi qua verifyToken trước
    const isOwner = req.user.id === listing.userRef.toString();
    const isAdmin = !!req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return next(
        errorHandler(401, "Bạn chỉ có thể xem bài đăng của mình để chỉnh sửa!")
      );
    }

    // KHÔNG check status / expiresAt ở đây
    // vì tin pending / rejected / hết hạn vẫn cần load cho màn edit
    return res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

// ========== XOÁ LISTING (USER, ADMIN) ==========
export const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return next(errorHandler(404, "Listing not found!"));
    }

    const isOwner = req.user.id === listing.userRef.toString();
    const isAdmin = !!req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return next(
        errorHandler(401, "Bạn chỉ có thể xóa bài đăng của mình!")
      );
    }

    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Listing đã được xóa thành công!" });
  } catch (error) {
    next(error);
  }
};

// ========== UPDATE LISTING ==========
export const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return next(errorHandler(404, "Listing not found!"));
    }

    const isOwner = req.user.id === listing.userRef.toString();
    const isAdmin = !!req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return next(
        errorHandler(401, "Bạn chỉ có thể sửa bài đăng của mình!")
      );
    }

    const updateData = { ...req.body };

    // Chủ tin sửa => đưa về trạng thái pending
    // KHÔNG cho tự đổi loại tin / ưu tiên / ngày hết hạn
    if (isOwner && !isAdmin) {
      updateData.listingType = listing.listingType;
      updateData.priority = listing.priority;
      updateData.expiresAt = listing.expiresAt;
      updateData.status = "pending";
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

// ========== DANH SÁCH LISTINGS PUBLIC ==========
export const getListings = async (req, res, next) => {
  try {
    // Hỗ trợ cả kiểu cũ (startIndex + limit) và kiểu mới (page + limit)
    const limit = parseInt(req.query.limit, 10) || 9;

    const hasPageParam = !!req.query.page;
    const page = hasPageParam ? parseInt(req.query.page, 10) || 1 : 1;

    // Ưu tiên startIndex (code cũ), nếu không có thì dùng page
    const startIndexFromQuery =
      req.query.startIndex != null ? parseInt(req.query.startIndex, 10) : null;
    const skip =
      Number.isInteger(startIndexFromQuery) && startIndexFromQuery >= 0
        ? startIndexFromQuery
        : (page - 1) * limit;

    // ====== FILTER CƠ BẢN (đã có) ======
    let offer = req.query.offer;
    if (offer === undefined || offer === "false") {
      offer = { $in: [false, true] };
    }

    let furnished = req.query.furnished;
    if (furnished === undefined || furnished === "false") {
      furnished = { $in: [false, true] };
    }

    let parking = req.query.parking;
    if (parking === undefined || parking === "false") {
      parking = { $in: [false, true] };
    }

    let type = req.query.type;
    if (type === undefined || type === "all") {
      type = { $in: ["sale", "rent"] };
    }

    const searchTerm = req.query.searchTerm || "";
    const sortField = req.query.sort || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const now = new Date();

    const query = {
      // Tìm theo tên / tiêu đề
      name: { $regex: searchTerm, $options: "i" },
      offer,
      furnished,
      parking,
      type,
      status: "approved",
      $or: [
        { expiresAt: { $gt: now } }, // còn hạn
        { expiresAt: { $exists: false } }, // data cũ chưa có field
      ],
    };

    // ====== FILTER KHU VỰC: TỈNH / QUẬN / PHƯỜNG ======
    const { province, district, ward } = req.query;

    if (province) {
      query.province = { $regex: province, $options: "i" };
    }
    if (district) {
      query.district = { $regex: district, $options: "i" };
    }
    if (ward) {
      query.ward = { $regex: ward, $options: "i" };
    }

    // ====== FILTER KHOẢNG GIÁ (regularPrice / Liên hệ) ======
    const priceMinRaw = req.query.priceMin;
    const priceMaxRaw = req.query.priceMax;

    // nếu có query này = true => chỉ xem tin "Liên hệ để biết giá"
    const priceContactOnly = req.query.priceContactOnly === "true";

    if (priceContactOnly) {
      // Chỉ lấy tin "Liên hệ để biết giá"
      query.priceContact = true;
    } else {
      // Lọc theo khoảng giá số (regularPrice), đồng thời loại tin "Liên hệ"
      const priceMin = priceMinRaw ? Number(priceMinRaw) : null;
      const priceMax = priceMaxRaw ? Number(priceMaxRaw) : null;

      if (
        (priceMinRaw !== undefined && priceMinRaw !== "") ||
        (priceMaxRaw !== undefined && priceMaxRaw !== "")
      ) {
        const priceCond = {};

        if (!Number.isNaN(priceMin) && priceMin != null) {
          priceCond.$gte = priceMin;
        }
        if (!Number.isNaN(priceMax) && priceMax != null) {
          priceCond.$lte = priceMax;
        }

        if (Object.keys(priceCond).length > 0) {
          query.regularPrice = priceCond;
          // Khi đã lọc theo khoảng giá số thì loại bỏ tin "Liên hệ để biết giá"
          query.priceContact = { $ne: true };
        }
      }
    }


    // ====== FILTER KHOẢNG DIỆN TÍCH (area) ======
    const areaMinRaw = req.query.areaMin;
    const areaMaxRaw = req.query.areaMax;

    const areaMin = areaMinRaw ? Number(areaMinRaw) : null;
    const areaMax = areaMaxRaw ? Number(areaMaxRaw) : null;

    if (
      (areaMinRaw !== undefined && areaMinRaw !== "") ||
      (areaMaxRaw !== undefined && areaMaxRaw !== "")
    ) {
      const areaCond = {};

      if (!Number.isNaN(areaMin) && areaMin != null) {
        areaCond.$gte = areaMin;
      }
      if (!Number.isNaN(areaMax) && areaMax != null) {
        areaCond.$lte = areaMax;
      }

      if (Object.keys(areaCond).length > 0) {
        query.area = areaCond;
      }
    }

    // ====== TỔNG SỐ BẢN GHI (phục vụ pagination FE) ======
    const total = await Listing.countDocuments(query);

    // ====== LẤY DANH SÁCH LISTINGS ======
    const listings = await Listing.find(query)
      // Premium > VIP > Thường, cùng loại thì sort thêm theo sortField
      .sort({ priority: -1, [sortField]: order })
      .limit(limit)
      .skip(skip);

    // Nếu FE gọi có `page` => trả về dạng { items, total, page, limit }
    if (hasPageParam) {
      return res.status(200).json({
        items: listings,
        total,
        page,
        limit,
      });
    }

    // Giữ nguyên behavior cũ: trả về array listings
    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};


// ========== DANH SÁCH LISTINGS THEO USER (PUBLIC PROFILE) ==========
export const getListingsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return next(errorHandler(400, "Missing userId param"));
    }

    // paging
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 9;
    const skip = (page - 1) * limit;

    // filter type
    let type = req.query.type;
    if (!type || type === "all") {
      type = { $in: ["sale", "rent"] };
    }

    // filter tiện ích (giống getListings, nhưng optional)
    let offer = req.query.offer;
    if (offer === undefined || offer === "false") {
      offer = { $in: [false, true] };
    }

    let furnished = req.query.furnished;
    if (furnished === undefined || furnished === "false") {
      furnished = { $in: [false, true] };
    }

    let parking = req.query.parking;
    if (parking === undefined || parking === "false") {
      parking = { $in: [false, true] };
    }

    const searchTerm = req.query.searchTerm || "";
    const sortField = req.query.sort || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const now = new Date();

    const baseQuery = {
      userRef: userId,
      name: { $regex: searchTerm, $options: "i" },
      offer,
      furnished,
      parking,
      type,
      status: "approved",
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: { $exists: false } },
      ],
    };

    const [items, total, totalSale, totalRent, user] = await Promise.all([
      Listing.find(baseQuery)
        .sort({ priority: -1, [sortField]: order })
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(baseQuery),
      Listing.countDocuments({ ...baseQuery, type: "sale" }),
      Listing.countDocuments({ ...baseQuery, type: "rent" }),
      User.findById(userId).select("username avatar phone email createdAt"),
    ]);

    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.username,
        avatar: user.avatar || "",
        phone: user.phone || "",
        zalo: user.phone || "",   // không có field zalo thì dùng luôn số ĐT
        email: user.email || "",
        joinedAt: user.createdAt,
      },
      stats: {
        total,
        totalSale,
        totalRent,
      },
      page,
      totalPages,
      items,
    });
  } catch (error) {
    next(error);
  }
};