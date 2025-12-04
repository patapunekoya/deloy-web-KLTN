// src/pages/Listing.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FaBath,
  FaBed,
  FaChair,
  FaMapMarkerAlt,
  FaParking,
  FaShare,
  FaRegCopy,
} from 'react-icons/fa';
import ListingItem from '../components/ListingItem';

// 👇 Swiper cho block Ưu đãi
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

// format giá VND fallback khi chỉ có số
function formatPriceVnd(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    return `${value.toLocaleString('vi-VN')} đ`;
  }
  return value; // nếu là string ("700 triệu") thì giữ nguyên
}

// format giá/m² dạng "~ 14 triệu/m²"
function formatPricePerM2(vndPerM2) {
  if (!vndPerM2 || Number.isNaN(vndPerM2)) return '';

  const million = vndPerM2 / 1_000_000;

  if (million >= 1) {
    const millionStr =
      million >= 10
        ? Math.round(million).toString()
        : million.toFixed(1).replace(/\.0$/, '');
    return `~ ${millionStr} triệu/m²`;
  }

  return `~ ${Math.round(vndPerM2).toLocaleString('vi-VN')} đ/m²`;
}

// format số thành dạng ngắn: 1.8 triệu, 4.5 tỷ...
function formatShortPriceVn(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '';
  }

  // >= 1 tỷ
  if (value >= 1_000_000_000) {
    const billions = Math.round((value / 1_000_000_000) * 10) / 10;
    const text = billions.toString();
    return `${text} tỷ`;
  }

  // >= 1 triệu
  if (value >= 1_000_000) {
    const millions = Math.round((value / 1_000_000) * 10) / 10;
    const text = millions.toString();
    return `${text} triệu`;
  }

  // nhỏ hơn 1 triệu thì để full VND
  return `${value.toLocaleString('vi-VN')} đ`;
}

export default function Listing() {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageFading, setIsImageFading] = useState(false);

  const [offerListings, setOfferListings] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  const params = useParams();
  const { currentUser } = useSelector((state) => state.user);
  const userId = currentUser?.rest?._id || currentUser?._id || null;

  // ======= FETCH LISTING + ƯU ĐÃI =======
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setErr('');
        const res = await fetch(`/api/listing/get/${params.listingId}`);
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          throw new Error(data?.message || 'Không tải được dữ liệu');
        }
        setListing(data);
        setActiveImageIndex(0);
      } catch (e) {
        setErr(e.message || 'Đã có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };

    const fetchOfferListings = async () => {
      try {
        setLoadingOffers(true);
        const res = await fetch(
          '/api/listing/get?offer=true&limit=10&order=desc&sort=createdAt',
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setOfferListings(data);
        } else {
          setOfferListings([]);
        }
      } catch {
        setOfferListings([]);
      } finally {
        setLoadingOffers(false);
      }
    };

    fetchListing();
    fetchOfferListings();
  }, [params.listingId]);

  // ======= RENDER STATE =======
  if (loading) {
    return (
      <main className="max-w-6xl mx-auto p-3">
        <div className="animate-pulse space-y-4">
          <div className="h-[420px] rounded-2xl bg-slate-200" />
          <div className="h-6 w-1/2 bg-slate-200 rounded" />
          <div className="h-4 w-1/3 bg-slate-200 rounded" />
          <div className="h-24 bg-slate-200 rounded" />
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="max-w-6xl mx-auto p-3">
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          {err}
        </div>
      </main>
    );
  }

  if (!listing) return null;

  const images = listing.imageUrls || [];
  const currentImage = images[activeImageIndex] || images[0] || '';

  const isOwner = userId && String(listing.userRef) === String(userId);

  // ======= HÀM ĐIỀU HƯỚNG + TRANSITION ẢNH =======
  const changeImage = (newIndex) => {
    if (!images.length) return;

    // wrap index
    let target = newIndex;
    if (newIndex < 0) target = images.length - 1;
    if (newIndex > images.length - 1) target = 0;
    if (target === activeImageIndex) return;

    setIsImageFading(true);
    setTimeout(() => {
      setActiveImageIndex(target);
      setIsImageFading(false);
    }, 120); // fade out nhanh rồi fade in
  };

  const handlePrevImage = () => {
    changeImage(activeImageIndex - 1);
  };

  const handleNextImage = () => {
    changeImage(activeImageIndex + 1);
  };

  // ======= GIÁ & LOGIC HIỂN THỊ =======
  const {
    offer,
    regularPrice,
    discountPrice,
    priceDisplay,
    priceContact,
    type,
    discountPriceDisplay, // text giá ưu đãi nếu có, ví dụ "1.8 triệu"
  } = listing;

  // giá gốc (numeric) để fallback (mặc định ưu tiên giá ưu đãi nếu có)
  const rawPrice = offer && discountPrice ? discountPrice : regularPrice;

  // text hiển thị cho giá chính
  let priceLabel;
  if (priceContact) {
    priceLabel = 'Liên hệ';
  } else if (priceDisplay && typeof priceDisplay === 'string') {
    priceLabel = priceDisplay;
  } else {
    priceLabel = formatPriceVnd(rawPrice);
  }

  // ====== GIÁ ƯU ĐÃI DẠNG CHỮ ======
  let discountLabel = '';
  if (!priceContact && offer) {
    if (discountPriceDisplay && typeof discountPriceDisplay === 'string') {
      discountLabel = discountPriceDisplay;
    } else if (typeof discountPrice === 'number' && discountPrice > 0) {
      discountLabel = formatShortPriceVn(discountPrice);
    }
  }

  // ====== GIÁ /m² TỰ TÍNH, CHỈ CHO NHÀ BÁN & KHÔNG "LIÊN HỆ" ======
  const numericPrice =
    typeof rawPrice === 'number' ? rawPrice : Number(rawPrice) || 0;
  const numericArea =
    typeof listing.area === 'number' ? listing.area : Number(listing.area) || 0;

  let pricePerM2Label = '';
  if (!priceContact && type === 'sale' && numericPrice > 0 && numericArea > 0) {
    const vndPerM2 = numericPrice / numericArea;
    pricePerM2Label = formatPricePerM2(vndPerM2); // ví dụ: "~ 14 triệu/m²"
  }

  // Contact
  const contactName = listing.contactName || 'Người đăng tin';
  const contactPhone = listing.contactPhone || '';
  const contactZalo = listing.contactZalo || '';
  const contactAvatar = listing.contactAvatar || null;
  const phoneDigits = contactPhone.replace(/[^0-9]/g, '');
  const zaloDigits = (contactZalo || phoneDigits).replace(/[^0-9]/g, '');
  const zaloUrl = zaloDigits ? `https://zalo.me/${zaloDigits}` : null;

  const copyPhone = async () => {
    if (!contactPhone) return;
    try {
      await navigator.clipboard.writeText(contactPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* kệ nó */
    }
  };

  const DetailRow = ({ label, value }) => (
    <div className="flex justify-between gap-4 py-1 text-sm border-b border-slate-100 last:border-none">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">
        {value || '-'}
      </span>
    </div>
  );

  return (
    <main className="bg-white">
      {/* NÚT SHARE FLOATING */}
      <button
        type="button"
        aria-label="Copy link"
        className="fixed top-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border bg-white/90 backdrop-blur-sm shadow-lg transition hover:shadow-xl"
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
      >
        <FaShare className="text-slate-700" />
      </button>

      {copied && (
        <p className="fixed top-36 right-4 z-40 rounded-md bg-slate-900 px-3 py-2 text-sm text-white shadow">
          Đã sao chép
        </p>
      )}

      {/* HERO GALLERY */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl p-3 md:p-4">
          {/* ẢNH CHÍNH VỚI BACKGROUND MỜ FILL 2 BÊN */}
          {currentImage && (
            <div className="relative h-[420px] rounded-2xl overflow-hidden md:h-[520px]">
              <div
                className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
                style={{ backgroundImage: `url(${currentImage})` }}
              />

              <div className="relative flex h-full w-full items-center justify-center">
                <img
                  src={currentImage}
                  alt={listing.name}
                  className={`max-h-full max-w-full rounded-xl object-contain shadow-xl transition-all duration-300 ease-out ${
                    isImageFading
                      ? 'opacity-0 scale-[0.99]'
                      : 'opacity-100 scale-100'
                  }`}
                />

                {/* Nút điều hướng ảnh trái / phải */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="
                        absolute left-3 top-1/2 -translate-y-1/2
                        flex h-10 w-10 items-center justify-center
                        rounded-full bg-black/45 text-lg text-white
                        transition hover:bg-black/65
                        md:left-5 md:h-11 md:w-11
                      "
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="
                        absolute right-3 top-1/2 -translate-y-1/2
                        flex h-10 w-10 items-center justify-center
                        rounded-full bg-black/45 text-lg text-white
                        transition hover:bg-black/65
                        md:right-5 md:h-11 md:w-11
                      "
                    >
                      ›
                    </button>

                    {/* Chỉ số ảnh: 2/6 */}
                    <div className="absolute bottom-3 right-4 rounded-full bg-black/55 px-3 py-1 text-xs text-white">
                      {activeImageIndex + 1}/{images.length}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* THUMBNAILS */}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((url, idx) => (
                <button
                  type="button"
                  key={url}
                  onClick={() => changeImage(idx)}
                  className={`relative h-20 w-28 shrink-0 rounded-lg border-2 overflow-hidden md:h-24 md:w-32 ${
                    idx === activeImageIndex
                      ? 'border-emerald-500'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  {idx === activeImageIndex && (
                    <span className="absolute bottom-1 right-1 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] text-white">
                      Đang xem
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* THÔNG TIN CHÍNH */}
      <section className="mx-auto max-w-6xl p-3 md:p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          {/* LEFT CONTENT */}
          <div className="space-y-5">
            {/* Tiêu đề + địa chỉ + giá */}
            <div>
              <h1 className="text-2xl font-bold leading-snug text-slate-800 md:text-3xl">
                {listing.name}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <FaMapMarkerAlt className="shrink-0 text-emerald-600" />
                <span>{listing.address}</span>
              </div>

              {/* Giá + Giá ưu đãi giống style card VIP/Premium */}
              <div className="mt-3 flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-sky-700">
                    {priceLabel || 'Liên hệ để biết giá'}
                    {!priceContact && type === 'rent' && (
                      <span className="ml-1 text-base text-slate-500">
                        /tháng
                      </span>
                    )}
                  </span>
                  {pricePerM2Label && (
                    <span className="text-sm text-slate-500">
                      {pricePerM2Label}
                    </span>
                  )}
                </div>

                {discountLabel && !priceContact && (
                  <div className="text-sm text-amber-700">
                    Giá ưu đãi:{' '}
                    <span className="font-semibold">
                      {discountLabel}
                      {type === 'rent' && ' /tháng'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* MÔ TẢ / TỔNG QUAN */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
              <h2 className="mb-2 text-lg font-semibold text-slate-800">
                Tổng quan
              </h2>
              <p className="whitespace-pre-line break-words leading-relaxed text-slate-700">
                {listing.description}
              </p>
            </div>

            {/* CHI TIẾT */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-800">
                Chi tiết
              </h2>
              <div className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
                <DetailRow
                  label="Diện tích"
                  value={listing.area && `${listing.area} m²`}
                />
                <DetailRow label="Pháp lý" value={listing.legalStatus} />
                <DetailRow label="Số phòng ngủ" value={listing.bedrooms} />
                <DetailRow label="Số phòng tắm" value={listing.bathrooms} />
                <DetailRow
                  label="Gara"
                  value={
                    typeof listing.parking === 'boolean'
                      ? listing.parking
                        ? 'Có'
                        : 'Không'
                      : listing.parking
                  }
                />
                <DetailRow
                  label="Nội thất"
                  value={
                    typeof listing.furnished === 'boolean'
                      ? listing.furnished
                        ? 'Đầy đủ'
                        : 'Trống'
                      : listing.furnished
                  }
                />
                <DetailRow
                  label="Hẻm"
                  value={listing.alleyWidth && `${listing.alleyWidth} m`}
                />
                <DetailRow
                  label="Rộng x Dài"
                  value={
                    listing.width || listing.length
                      ? `${listing.width || '-'} x ${
                          listing.length || '-'
                        } m`
                      : ''
                  }
                />
                <DetailRow label="Số tầng" value={listing.floors} />
                <DetailRow label="Số toilet" value={listing.toilets} />
                <DetailRow label="Hướng" value={listing.direction} />

                {/* Mức giá & ưu đãi dùng cùng logic với header */}
                <DetailRow label="Mức giá" value={priceLabel} />
                {!priceContact && offer && discountLabel && (
                  <DetailRow
                    label="Giá ưu đãi"
                    value={`${discountLabel}${type === 'rent' ? ' /tháng' : ''}`}
                  />
                )}

                {/* Giá đất (ước tính) chỉ hiện khi có pricePerM2Label */}
                <DetailRow
                  label="Giá đất (ước tính)"
                  value={pricePerM2Label}
                />
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: LIÊN HỆ TƯ VẤN */}
          <aside className="lg:pl-2">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Liên hệ tư vấn
                  </h3>
                </div>

                <div className="space-y-4 px-4 py-4">
                {/* Info môi giới */}
                {listing.userRef ? (
                  <Link
                    to={`/user/${listing.userRef}`}
                    className="flex items-center gap-3 hover:opacity-95 transition"
                  >
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                      {contactAvatar ? (
                        <img
                          src={contactAvatar}
                          alt={contactName || 'Người đăng tin'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{contactName?.[0]?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {contactName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isOwner
                          ? 'Bạn là chủ tin'
                          : 'Môi giới / Người đăng tin'}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                      {contactAvatar ? (
                        <img
                          src={contactAvatar}
                          alt={contactName || 'Người đăng tin'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{contactName?.[0]?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {contactName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isOwner
                          ? 'Bạn là chủ tin'
                          : 'Môi giới / Người đăng tin'}
                      </div>
                    </div>
                  </div>
                )}


                  {/* SĐT */}
                  {contactPhone && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">
                        Số điện thoại
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-base font-semibold text-slate-900">
                          {contactPhone}
                        </div>
                        <button
                          type="button"
                          onClick={copyPhone}
                          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100"
                        >
                          <FaRegCopy className="text-sm text-slate-600" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Zalo */}
                  {zaloUrl && (
                    <a
                      href={zaloUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-sky-500 text-sm font-semibold text-sky-600 hover:bg-sky-50"
                    >
                      Nhắn tin qua Zalo
                    </a>
                  )}

                  {/* Email (nếu có) */}
                  {listing.contactEmail && (
                    <p className="break-all text-xs text-slate-500">
                      Email:{' '}
                      <span className="font-medium">
                        {listing.contactEmail}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ƯU ĐÃI NỔI BẬT */}
      <section className="mx-auto max-w-6xl pb-8 px-3 md:px-4">
        <div className="mt-4 border-t border-slate-200 pt-6">
          {loadingOffers ? (
            <OfferSectionSkeleton title="Ưu đãi nổi bật" />
          ) : (
            offerListings &&
            offerListings.length > 0 && (
              <div>
                <div className="my-3 flex items-end justify-between">
                  <h2 className="text-xl font-semibold text-slate-700 md:text-2xl">
                    Ưu đãi nổi bật
                  </h2>
                  <Link
                    className="text-sm text-blue-800 hover:underline"
                    to="/search?offer=true"
                  >
                    Xem thêm ưu đãi
                  </Link>
                </div>

                {/* Swiper: kéo / vuốt để lướt card */}
                <Swiper
                  spaceBetween={16}
                  slidesPerView={1.1}
                  breakpoints={{
                    640: { slidesPerView: 2.1 },
                    900: { slidesPerView: 3.1 },
                    1200: { slidesPerView: 4.1 },
                  }}
                >
                  {offerListings.map((item) => (
                    <SwiperSlide key={item._id}>
                      <div className="h-full">
                        <ListingItem listing={item} />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}

/* ===== Skeleton cho block Ưu đãi ===== */
function OfferSectionSkeleton({ title }) {
  return (
    <div>
      <div className="my-3 flex items-end justify-between">
        <h2 className="text-xl font-semibold text-slate-700 md:text-2xl">
          {title}
        </h2>
        <div className="h-4 w-24 rounded bg-slate-100" />
      </div>
      <div className="flex gap-4 overflow-x-hidden">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 min-w-[260px] max-w-[280px] animate-pulse rounded-xl border border-slate-200 bg-white p-2"
          >
            <div className="mb-2 h-32 rounded-lg bg-slate-100" />
            <div className="mb-1 h-4 w-3/4 rounded bg-slate-100" />
            <div className="mb-2 h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-3 w-1/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
