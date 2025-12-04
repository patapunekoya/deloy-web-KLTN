// src/components/ListingItem.jsx
import { Link } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaRegImages,
} from 'react-icons/fa';

// format giá VND fallback khi không có priceDisplay
function formatPriceVnd(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    return `${value.toLocaleString('vi-VN')} đ`;
  }
  // nếu là string (data cũ) thì trả lại luôn
  return value;
}

// format giá/m² dạng "~ 14 triệu/m²"
function formatPricePerM2(vndPerM2) {
  if (!vndPerM2 || Number.isNaN(vndPerM2)) return '';

  const million = vndPerM2 / 1_000_000;

  if (million >= 1) {
    // >= 1 triệu thì hiển thị theo đơn vị triệu
    const millionStr =
      million >= 10
        ? Math.round(million).toString()
        : million.toFixed(1).replace(/\.0$/, '');
    return `~ ${millionStr} triệu/m²`;
  }

  // nhỏ hơn 1 triệu/m² thì để nguyên VND
  return `~ ${Math.round(vndPerM2).toLocaleString('vi-VN')} đ/m²`;
}

// format số thành "1.8 triệu", "4.2 tỷ"...
function formatShortPriceVn(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '';
  }

  if (value >= 1_000_000_000) {
    const billions = Math.round((value / 1_000_000_000) * 10) / 10;
    const text = Number.isInteger(billions)
      ? billions.toString()
      : billions.toString();
    return `${text} tỷ`;
  }

  if (value >= 1_000_000) {
    const millions = Math.round((value / 1_000_000) * 10) / 10;
    const text = Number.isInteger(millions)
      ? millions.toString()
      : millions.toString();
    return `${text} triệu`;
  }

  return `${value.toLocaleString('vi-VN')} đ`;
}

export default function ListingItem({ listing }) {
  const {
    _id,
    imageUrls = [],
    name = '',
    address = '',
    offer = false,
    regularPrice = '',
    discountPrice = '',
    type = 'rent',
    bedrooms = 0,
    bathrooms = 0,
    area = '', // m² (Number trong DB, string default ở đây)

    // NEW: dùng chung với form & các card khác
    priceDisplay = '', // chuỗi: "400 triệu", "4 tỷ", ...
    priceContact = false, // từ CreateListing hiện tại
    isContactPrice = false, // nếu sau này ông đổi tên theo option B

    // NEW: text giá ưu đãi nếu có, ví dụ: "1.8 triệu"
    discountPriceDisplay = '',
  } = listing || {};

  const mainImage = imageUrls[0] || '';
  const imagesCount = imageUrls.length;

  // cờ "Liên hệ"
  const contactFlag = priceContact || isContactPrice;

  // rawPrice để fallback (ưu tiên discount nếu có offer và không phải "Liên hệ")
  const rawPrice =
    offer && !contactFlag && discountPrice
      ? discountPrice
      : regularPrice;

  // Hiển thị giá:
  // 1. Liên hệ
  // 2. priceDisplay (text user nhập)
  // 3. format số VND
  // 4. fallback cuối: Liên hệ để biết giá
  let priceLabel;
  if (contactFlag) {
    priceLabel = 'Liên hệ';
  } else if (priceDisplay) {
    priceLabel = priceDisplay;
  } else if (rawPrice) {
    priceLabel = formatPriceVnd(rawPrice);
  } else {
    priceLabel = 'Liên hệ để biết giá';
  }

  // ====== TÍNH GIÁ /m² CHỈ CHO NHÀ BÁN ======
  const numericPrice =
    typeof rawPrice === 'number'
      ? rawPrice
      : Number(rawPrice) || 0;

  const numericArea =
    typeof area === 'number'
      ? area
      : Number(area) || 0;

  let pricePerM2Label = '';
  if (
    !contactFlag && // không phải "Liên hệ"
    type === 'sale' && // chỉ áp dụng cho nhà bán
    numericPrice > 0 &&
    numericArea > 0
  ) {
    const vndPerM2 = numericPrice / numericArea;
    pricePerM2Label = formatPricePerM2(vndPerM2);
  }

  // ====== GIÁ ƯU ĐÃI LABEL ======
  let discountLabel = '';
  if (!contactFlag && offer) {
    if (discountPriceDisplay && typeof discountPriceDisplay === 'string') {
      discountLabel = discountPriceDisplay;
    } else if (typeof discountPrice === 'number' && discountPrice > 0) {
      discountLabel = formatShortPriceVn(discountPrice);
    }
  }

  return (
    <Link
      to={`/listing/${_id}`}
      className="
        group block h-[390px]
        rounded-3xl border border-slate-200 bg-white
        p-3
        hover:shadow-lg hover:-translate-y-[2px]
        transition-all duration-150
      "
    >
      {/* Ảnh */}
      <div className="relative">
        <div className="rounded-2xl overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage}
              alt={name}
              loading="lazy"
              className="
                w-full h-48
                object-cover
                transition-transform duration-200
                group-hover:scale-[1.02]
              "
            />
          ) : (
            <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
              Không có ảnh
            </div>
          )}
        </div>

        {/* Số ảnh */}
        {imagesCount > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 text-white px-2 py-1 text-[11px]">
            <FaRegImages className="text-[11px]" />
            <span>{imagesCount}</span>
          </div>
        )}

        {/* Tag ưu đãi nhỏ */}
        {offer && (
          <div className="absolute bottom-2 left-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-semibold">
              Ưu đãi
            </span>
          </div>
        )}
      </div>

      {/* Nội dung */}
      <div className="mt-3 space-y-2">
        {/* Tên, cố định chiều cao, quá dài thì ... */}
        <h3
          className="
            text-sm font-semibold text-slate-900
            leading-snug line-clamp-2
            h-[40px] 
          "
          title={name}
        >
          {name}
        </h3>

        {/* Giá + giá/m² + giá ưu đãi */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-lg font-extrabold text-blue-600">
              {priceLabel}
            </span>
            {pricePerM2Label && (
              <span className="text-[11px] text-slate-500">
                {pricePerM2Label}
              </span>
            )}
            {type === 'rent' && !contactFlag && (
              <span className="text-[11px] text-slate-500">/ tháng</span>
            )}
          </div>

          {discountLabel && (
            <div className="text-[11px] text-amber-700">
              Giá ưu đãi:{' '}
              <span className="font-semibold">
                {discountLabel}
                {type === 'rent' && !contactFlag && ' / tháng'}
              </span>
            </div>
          )}
        </div>

        {/* Địa chỉ: chỉ 1 dòng, dài thì ... */}
        <div className="flex items-start gap-1 text-xs text-slate-500">
          <FaMapMarkerAlt className="mt-[2px] text-emerald-600 shrink-0" />
          <span className="line-clamp-1" title={address}>
            {address}
          </span>
        </div>

        {/* Thông số nhỏ */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-1">
            <FaRulerCombined className="text-slate-500" />
            <span>{numericArea ? `${numericArea} m²` : '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaBed className="text-slate-500" />
            <span>{bedrooms || 0} PN</span>
          </div>
          <div className="flex items-center gap-1">
            <FaBath className="text-slate-500" />
            <span>{bathrooms || 0} WC</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
