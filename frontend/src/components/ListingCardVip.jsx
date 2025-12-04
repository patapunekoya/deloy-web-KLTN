// src/components/cards/ListingCardVip.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaRegImages,
  FaRulerCombined,
  FaBed,
  FaBath,
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
  // nếu là string (vd: "4 tỷ", "400 triệu") → trả nguyên
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

  // nhỏ hơn 1 triệu thì để full VND
  return `${value.toLocaleString('vi-VN')} đ`;
}

export default function ListingCardVip({ listing }) {
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
    createdAt,
    contactAvatar,
    shortDesc,
    description = '',
    priceDisplay = '',
    priceContact = false,
    // text giá ưu đãi nếu có, ví dụ "650 triệu"
    discountPriceDisplay = '',
    userRef = '',
  } = listing;

  // mô tả tối đa 2 dòng
  const desc = shortDesc || description || '';

  // ================== TÍNH GIÁ HIỂN THỊ ==================
  const rawPrice = offer ? discountPrice : regularPrice;

  let displayPrice;
  if (priceContact) {
    displayPrice = 'Liên hệ';
  } else if (priceDisplay && typeof priceDisplay === 'string') {
    displayPrice = priceDisplay;
  } else {
    displayPrice = formatPriceVnd(rawPrice);
  }

  // giá ưu đãi (dùng "triệu / tỷ" giống Normal + Premium)
  let discountLabel = null;
  if (offer && !priceContact) {
    if (discountPriceDisplay && typeof discountPriceDisplay === 'string') {
      discountLabel = discountPriceDisplay;
    } else if (typeof discountPrice === 'number' && discountPrice > 0) {
      discountLabel = formatShortPriceVn(discountPrice);
    }
  }
  // =======================================================

  // 1 ảnh lớn + 3 ảnh nhỏ
  const imgs = imageUrls.slice(0, 4);
  const [main, s1, s2, s3] = imgs;
  const imgCount = imageUrls.length;

  // label thời gian đăng
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
      // kệ nó
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
      className="block rounded-2xl border border-yellow-200 bg-white hover:shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-shadow overflow-hidden"
    >
      <div className="relative flex flex-col lg:flex-row">
        {/* GALLERY BÊN TRÁI */}
        <div className="w-full lg:w-[36%] flex-shrink-0">
          <div className="relative h-52 md:h-56 lg:h-60 bg-transparent">
            {/* padding để lộ viền card */}
            <div className="h-full w-full p-2">
              {/* Mobile: chỉ 1 ảnh */}
              <div className="block md:hidden h-full w-full rounded-2xl overflow-hidden bg-slate-100">
                {main && (
                  <img
                    src={main}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              {/* Desktop / tablet: 1 ảnh lớn trên + 3 ảnh nhỏ dưới */}
              <div className="hidden md:grid h-full w-full grid-cols-3 grid-rows-2 gap-1 rounded-2xl overflow-hidden bg-slate-100">
                {/* Ảnh lớn trên (chiếm 3 cột, 1 hàng) */}
                <div className="col-span-3 row-span-1">
                  {main && (
                    <img
                      src={main}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                {/* 3 ảnh nhỏ dưới */}
                <div className="col-span-1 row-span-1">
                  {s1 && (
                    <img
                      src={s1}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="col-span-1 row-span-1">
                  {s2 && (
                    <img
                      src={s2}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="col-span-1 row-span-1">
                  {s3 && (
                    <img
                      src={s3}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* VIP badge dạng tag mọc ra từ card */}
            <div className="absolute left-0 top-3 z-20">
              <div className="relative inline-flex">
                <div className="rounded-full rounded-bl-none bg-[#FBBF24] px-4 py-1 text-xs font-semibold text-white shadow">
                  VIP
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
                    border-t-[#FBBF24]
                  "
                />
              </div>
            </div>

            {/* Thời gian & số ảnh */}
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
        </div>

        {/* NỘI DUNG BÊN PHẢI */}
        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
          <div>
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

            {/* Giá + giá ưu đãi */}
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold text-sky-600">
                  {displayPrice}
                  {!priceContact && type === 'rent' && (
                    <span className="ml-1 text-sm text-slate-500">
                      /tháng
                    </span>
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

            {/* diện tích / PN / WC */}
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

            {/* mô tả 2 dòng, dư thì ... */}
            {desc && (
              <p className="mt-3 text-xs md:text-sm text-slate-600 line-clamp-2 break-all">
                {desc}
              </p>
            )}

            <div className="mt-2 text-[11px] text-slate-500">
              Tin VIP · Ưu tiên hiển thị cao
            </div>
          </div>

          {/* FOOTER LIÊN HỆ */}
          <div
            className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"
            onClick={handleFooterClick}
          >
            {/* Avatar + tên → trang cá nhân */}
            <button
              type="button"
              onClick={handleAvatarClick}
              className="flex items-center gap-2 hover:opacity-95"
            >
              <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                {contactAvatar ? (
                  <img
                    src={contactAvatar}
                    alt={contactName || 'Người đăng'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-700">
                    {avatarLetter}
                  </span>
                )}
              </div>
              <div className="text-xs text-left">
                <div className="font-medium text-slate-800 line-clamp-1">
                  {contactName || 'Người đăng'}
                </div>
                <div className="text-slate-400">Môi giới / Chủ nhà</div>
              </div>
            </button>

            {contactPhone && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePhone}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
                >
                  <FiPhone size={16} />
                  {phoneToShow}
                </button>

                {showFullPhone && (
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="inline-flex items-center gap-1 rounded-full border border-sky-500 px-3 py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50"
                  >
                    <FaRegCopy className="text-[11px]" />
                    {copied ? 'Đã copy' : 'Copy'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
