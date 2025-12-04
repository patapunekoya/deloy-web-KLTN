// src/components/cards/ListingCardNormal.jsx
import { Link } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaRulerCombined,
  FaBed,
  FaBath,
  FaRegImages,
} from 'react-icons/fa';

// format VND cơ bản (fallback)
function formatPriceVnd(value) {
  if (value === null || value === undefined || value === '') return 'Liên hệ';
  if (typeof value === 'number') {
    return `${value.toLocaleString('vi-VN')} đ`;
  }
  // nếu là string ("700 triệu", "4.2 tỷ") thì để nguyên
  return value;
}

// format số thành dạng ngắn: 1.8 triệu, 4.5 tỷ...
function formatShortPriceVn(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '';
  }

  // >= 1 tỷ
  if (value >= 1_000_000_000) {
    const billions = Math.round((value / 1_000_000_000) * 10) / 10; // 1 số thập phân
    const text = Number.isInteger(billions) ? billions.toString() : billions.toString();
    return `${text} tỷ`;
  }

  // >= 1 triệu
  if (value >= 1_000_000) {
    const millions = Math.round((value / 1_000_000) * 10) / 10;
    const text = Number.isInteger(millions) ? millions.toString() : millions.toString();
    return `${text} triệu`;
  }

  // nhỏ hơn 1 triệu thì thôi để VND đầy đủ
  return `${value.toLocaleString('vi-VN')} đ`;
}

export default function ListingCardNormal({ listing }) {
  if (!listing) return null;

  const {
    _id,
    imageUrls = [],
    name = '',
    address = '',
    regularPrice = 0,
    discountPrice = 0,
    offer = false,
    type = 'rent',
    bedrooms = 0,
    bathrooms = 0,
    area = null,
    createdAt,
    // field mới / chung với các card khác
    priceDisplay = '',
    priceContact = false,
    // nếu sau này anh cho nhập chữ cho giá ưu đãi thì map vào đây
    discountPriceDisplay = '',
  } = listing;

  const mainImage = imageUrls[0] || '';
  const imgCount = imageUrls.length;

  // ======== TIME LABEL =========
  let timeLabel = 'Tin mới đăng';
  if (createdAt) {
    const created = new Date(createdAt);
    if (!Number.isNaN(created.getTime())) {
      const diffDays = Math.floor(
        (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays <= 0) timeLabel = 'Hôm nay';
      else if (diffDays === 1) timeLabel = '1 ngày trước';
      else timeLabel = `${diffDays} ngày trước`;
    }
  }
  // =============================

  // ======== GIÁ HIỂN THỊ CHÍNH =========
  const rawPrice = offer ? discountPrice : regularPrice;

  let displayPrice;
  if (priceContact) {
    displayPrice = 'Liên hệ';
  } else if (priceDisplay && typeof priceDisplay === 'string') {
    displayPrice = priceDisplay;
  } else {
    displayPrice = formatPriceVnd(rawPrice);
  }

  // ======== LABEL GIÁ ƯU ĐÃI (1.8 triệu, 4.5 tỷ, ...) =========
  let discountLabel = '';
  if (offer && !priceContact) {
    if (discountPriceDisplay && typeof discountPriceDisplay === 'string') {
      // nếu anh lưu text riêng cho giá ưu đãi thì ưu tiên dùng
      discountLabel = discountPriceDisplay;
    } else if (typeof discountPrice === 'number' && discountPrice > 0) {
      // còn không thì tự format từ số → "triệu / tỷ"
      discountLabel = formatShortPriceVn(discountPrice);
    }
  }
  // ============================================================

  return (
    <Link
      to={`/listing/${_id}`}
      className="block rounded-2xl border border-slate-200 bg-white hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] transition-shadow overflow-hidden"
    >
      <div className="relative flex flex-col md:flex-row">
        {/* GALLERY: 1 ẢNH, BO GÓC + PADDING VIỀN */}
        <div className="w-full md:w-[35%] flex-shrink-0">
          <div className="relative h-44 md:h-48 bg-transparent">
            <div className="h-full w-full p-2">
              <div className="h-full w-full rounded-2xl overflow-hidden bg-slate-100">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                    Không có ảnh
                  </div>
                )}
              </div>
            </div>

            {/* Thời gian đăng */}
            <div className="absolute left-4 bottom-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] text-white">
              {timeLabel}
            </div>

            {/* Số ảnh */}
            {imgCount > 0 && (
              <div className="absolute right-4 bottom-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] text-white">
                <FaRegImages className="text-xs" />
                {imgCount}
              </div>
            )}
          </div>
        </div>

        {/* NỘI DUNG */}
        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
          <div>
            {/* Tên tin */}
            <h3 className="text-base md:text-lg font-semibold text-slate-900 leading-snug line-clamp-2">
              {name}
            </h3>

            {/* Địa chỉ */}
            <div className="mt-2 flex items-center gap-2 text-xs md:text-sm text-slate-600">
              <FaMapMarkerAlt className="text-emerald-600 shrink-0" />
              <span className="line-clamp-1" title={address}>
                {address}
              </span>
            </div>

            {/* Giá + giá ưu đãi (đồng bộ kiểu VIP) */}
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold text-sky-600">
                  {displayPrice}
                  {!priceContact && type === 'rent' && (
                    <span className="ml-1 text-sm text-slate-500">/tháng</span>
                  )}
                </span>
                {offer &&
                  !priceContact &&
                  typeof regularPrice === 'number' &&
                  regularPrice > 0 && (
                    <span className="text-xs line-through text-slate-400">
                      {regularPrice.toLocaleString('vi-VN')} đ
                    </span>
                  )}
              </div>

              {discountLabel && (
                <div className="text-xs md:text-sm text-amber-700">
                  Giá ưu đãi:{' '}
                  <span className="font-semibold">
                    {discountLabel}
                    {!priceContact && type === 'rent' && ' /tháng'}
                  </span>
                </div>
              )}
            </div>

            {/* Diện tích / PN / WC với icon giống các card khác */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs md:text-[13px] text-slate-700">
              <span className="inline-flex items-center gap-1">
                <FaRulerCombined className="text-slate-500" />
                {area ? `${area} m²` : 'Diện tích: -'}
              </span>
              <span className="inline-flex items-center gap-1">
                <FaBed className="text-slate-500" />
                {bedrooms || 0} PN
              </span>
              <span className="inline-flex items-center gap-1">
                <FaBath className="text-slate-500" />
                {bathrooms || 0} WC
              </span>
            </div>

            <div className="mt-2 text-[11px] text-slate-500">Tin thường</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
