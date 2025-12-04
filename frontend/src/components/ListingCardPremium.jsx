// src/components/cards/ListingCardPremium.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaBath,
  FaBed,
  FaRulerCombined,
  FaRegImages,
  FaRegCopy,
} from 'react-icons/fa';
import { FiPhone } from 'react-icons/fi';

function maskPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  return digits.slice(0, digits.length - 3) + '***';
}

function formatPriceVnd(value) {
  if (value === null || value === undefined || value === '') return 'Liên hệ';
  if (typeof value === 'number') {
    return `${value.toLocaleString('vi-VN')} đ`;
  }
  // nếu là string (kiểu "4.8 tỷ") thì trả thẳng
  return value;
}

// format số thành dạng ngắn: 1.8 triệu, 4.5 tỷ...
function formatShortPriceVn(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '';
  }

  // >= 1 tỷ
  if (value >= 1_000_000_000) {
    const billions = Math.round((value / 1_000_000_000) * 10) / 10;
    const text = Number.isInteger(billions)
      ? billions.toString()
      : billions.toString();
    return `${text} tỷ`;
  }

  // >= 1 triệu
  if (value >= 1_000_000) {
    const millions = Math.round((value / 1_000_000) * 10) / 10;
    const text = Number.isInteger(millions)
      ? millions.toString()
      : millions.toString();
    return `${text} triệu`;
  }

  // nhỏ hơn 1 triệu thì thôi để VND đầy đủ
  return `${value.toLocaleString('vi-VN')} đ`;
}

export default function ListingCardPremium({ listing }) {
  const [showFullPhone, setShowFullPhone] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

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
    contactName,
    contactPhone,
    shortDesc,
    description = '',
    createdAt,
    contactAvatar,
    // field giá hiển thị
    priceDisplay = '',
    priceContact = false,
    // field mới để hiển thị giá ưu đãi dạng chữ (nếu có)
    discountPriceDisplay = '',
    userRef = '',
  } = listing;

  // ======== GIÁ HIỂN THỊ CHÍNH ========
  const rawPrice = offer ? discountPrice : regularPrice;

  let displayPrice;
  if (priceContact) {
    displayPrice = 'Liên hệ';
  } else if (priceDisplay && typeof priceDisplay === 'string') {
    displayPrice = priceDisplay;
  } else {
    displayPrice = formatPriceVnd(rawPrice);
  }

  // giá/m² (chỉ hợp lý cho nhà bán)
  const numericPrice =
    !priceContact &&
    type === 'sale' &&
    typeof rawPrice === 'number' &&
    typeof area === 'number' &&
    area > 0
      ? Math.round(rawPrice / area)
      : null;

  const pricePerM2 = numericPrice
    ? `${numericPrice.toLocaleString('vi-VN')} đ/m²`
    : null;

  // ======== LABEL GIÁ ƯU ĐÃI (dùng "triệu / tỷ") ========
  let discountLabel = null;
  if (offer && !priceContact) {
    if (discountPriceDisplay && typeof discountPriceDisplay === 'string') {
      // nếu backend có lưu text riêng thì ưu tiên dùng text đó
      discountLabel = discountPriceDisplay;
    } else if (typeof discountPrice === 'number' && discountPrice > 0) {
      // ngược lại tự format từ số sang 1.8 triệu / 4.5 tỷ
      discountLabel = formatShortPriceVn(discountPrice);
    }
  }
  // =====================================================

  // lấy tối đa 5 ảnh, nhưng layout dùng 5 vị trí như hình
  const imgs = imageUrls.slice(0, 5);
  const [img1, img2, img3, img4, img5] = imgs;
  const imgCount = imageUrls.length;

  // label "x ngày trước"
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

  const avatarLetter = (contactName || 'N').charAt(0).toUpperCase();
  const phoneDigits = contactPhone?.replace(/\D/g, '') || '';

  // mô tả ưu tiên shortDesc, không có thì dùng description
  const desc = shortDesc || description || '';

  const phoneToShow = showFullPhone
    ? contactPhone
    : maskPhone(contactPhone || '');

  const handleTogglePhone = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFullPhone((prev) => !prev);
    if (copied) setCopied(false);
  };

  const handleCopyPhone = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!contactPhone) return;
    try {
      await navigator.clipboard.writeText(contactPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // kệ
    }
  };

  const handleFooterClick = (e) => {
    // chặn click footer khỏi Link cha
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAvatarClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (userRef) {
      navigate(`/user/${userRef}`);
    }
  };

  return (
    <Link
      to={`/listing/${_id}`}
      className="block rounded-2xl border border-orange-200 bg-white hover:shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-shadow overflow-hidden"
    >
      <div className="relative">
        {/* GALLERY TRÊN CÙNG */}
        <div className="relative h-56 md:h-60 lg:h-64 bg-transparent">
          <div className="h-full w-full p-2">
            <div className="grid h-full w-full grid-cols-6 grid-rows-2 gap-1 rounded-2xl overflow-hidden bg-slate-100">
              <div className="col-span-2 row-span-2">
                {img1 && (
                  <img
                    src={img1}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="col-span-2 row-span-2">
                {img2 && (
                  <img
                    src={img2}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="col-span-2 row-span-1">
                {img3 && (
                  <img
                    src={img3}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="col-span-2 row-span-1 grid grid-cols-2 gap-1">
                <div>
                  {img4 && (
                    <img
                      src={img4}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div>
                  {img5 && (
                    <img
                      src={img5}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PREMIUM badge kiểu tag mọc ra từ card */}
          <div className="absolute left-0 top-3 z-20">
            <div className="relative inline-flex ">
              <div className="rounded-full rounded-bl-none bg-[#FA541C] px-4 py-1 text-xs font-semibold text-white shadow">
                PREMIUM
              </div>
              <span
                className="
                  absolute
                  left-0
                  -bottom-[8px]
                  h-0
                  w-0
                  border-l-[8px]
                  border-l-transparent
                  border-t-[8px]
                  border-t-[#FA541C]
                "
              />
            </div>
          </div>

          {/* Thời gian & đếm ảnh ở dưới */}
          <div className="absolute left-4 bottom-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] text-white">
            {timeLabel}
          </div>
          {imgCount > 0 && (
            <div className="absolute right-4 bottom-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] text-white">
              <FaRegImages className="text-xs" />
              {imgCount}
            </div>
          )}
        </div>

        {/* INFO GIỮA CARD */}
        <div className="px-4 pt-3 pb-2">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 leading-snug line-clamp-2">
            {name}
          </h3>

          <div className="mt-2 flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-sky-600">
                {displayPrice}
              </span>
              {pricePerM2 && (
                <span className="text-xs md:text-sm text-slate-500">
                  (~{pricePerM2})
                </span>
              )}
              {!priceContact && type === 'rent' && (
                <span className="text-xs md:text-sm text-slate-500">
                  / tháng
                </span>
              )}
            </div>

            {discountLabel && (
              <div className="text-xs md:text-sm text-amber-700">
                Giá ưu đãi:{' '}
                <span className="font-semibold">
                  {discountLabel}
                  {!priceContact && type === 'rent' && ' / tháng'}
                </span>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs md:text-sm text-slate-600">
            <FaMapMarkerAlt className="text-emerald-600 shrink-0" />
            <span className="line-clamp-1" title={address}>
              {address}
            </span>
          </div>

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

          {desc && (
            <p className="mt-3 text-xs md:text-sm text-slate-600 line-clamp-2 break-words">
              {desc}
            </p>
          )}
        </div>

        {/* FOOTER MÔI GIỚI DƯỚI CÙNG */}
        <div
          className="mt-1 flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3"
          onClick={handleFooterClick}
        >
          {/* Avatar + tên → trang cá nhân */}
          <button
            type="button"
            onClick={handleAvatarClick}
            className="flex items-center gap-3 hover:opacity-95"
          >
            <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
              {contactAvatar ? (
                <img
                  src={contactAvatar}
                  alt={contactName || 'Người đăng'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-slate-700">
                  {avatarLetter}
                </span>
              )}
            </div>
            <div className="text-xs leading-tight text-left">
              <div className="font-medium text-slate-900 line-clamp-1">
                {contactName || 'Người đăng'}
              </div>
              <div className="text-[11px] text-slate-500">
                Môi giới / Chủ nhà · Tin Premium
              </div>
            </div>
          </button>

          {/* Phone actions */}
          <div className="flex items-center gap-2">
            {contactPhone && (
              <>
                <button
                  type="button"
                  onClick={handleTogglePhone}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
                >
                  <FiPhone size={14} />
                  {phoneToShow}
                </button>

                {showFullPhone && (
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="inline-flex items-center justify-center rounded-full border border-sky-500 px-3 py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50"
                  >
                    <FaRegCopy className="mr-1" />
                    {copied ? 'Đã copy' : 'Copy'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
