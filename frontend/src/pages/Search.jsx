// src/pages/Search.jsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ListingCardPremium from '../components/ListingCardPremium';
import ListingCardVip from '../components/ListingCardVip';
import ListingCardNormal from '../components/ListingCardNormal';

import dvhcvn from '../data/dvhcvn.json';

const PAGE_LIMIT = 10;

// ============= HELPERS =============

// chuẩn hoá text: bỏ dấu, lowercase
function normalizeText(str = '') {
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Chuẩn hoá dvhcvn top-level => provinces
const normalizeProvinces = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (raw?.provinces) return raw.provinces;
  if (raw?.data) return raw.data;
  if (raw?.items) return raw.items;
  return [];
};

const getDistricts = (province) => {
  if (!province) return [];
  return (
    province.districts ||
    province.children ||
    province.quanHuyen ||
    province.level2s ||
    []
  );
};

const getWards = (district) => {
  if (!district) return [];
  return (
    district.wards ||
    district.children ||
    district.xaPhuong ||
    district.level3s ||
    []
  );
};

// khoảng giá nhanh
const PRICE_RANGES = [
  { label: 'Dưới 500 triệu', min: 0, max: 500_000_000 },
  { label: '500 - 800 triệu', min: 500_000_000, max: 800_000_000 },
  { label: '800 triệu - 1 tỷ', min: 800_000_000, max: 1_000_000_000 },
  { label: '1 - 2 tỷ', min: 1_000_000_000, max: 2_000_000_000 },
  { label: '2 - 3 tỷ', min: 2_000_000_000, max: 3_000_000_000 },
  { label: '3 - 5 tỷ', min: 3_000_000_000, max: 5_000_000_000 },
  { label: '5 - 7 tỷ', min: 5_000_000_000, max: 7_000_000_000 },
  { label: '7 - 10 tỷ', min: 7_000_000_000, max: 10_000_000_000 },
  { label: '10 - 20 tỷ', min: 10_000_000_000, max: 20_000_000_000 },
  { label: '20 - 30 tỷ', min: 20_000_000_000, max: 30_000_000_000 },
  { label: '30 - 40 tỷ', min: 30_000_000_000, max: 40_000_000_000 },
  { label: '40 - 60 tỷ', min: 40_000_000_000, max: 60_000_000_000 },
  { label: 'Trên 60 tỷ', min: 60_000_000_000, max: '' },
  // đặc biệt: chỉ hiện tin priceContact = true
  { label: 'Giá thỏa thuận', min: '', max: '' },
];

// khoảng diện tích nhanh
const AREA_RANGES = [
  { label: 'Dưới 30 m²', min: 0, max: 30 },
  { label: '30 - 50 m²', min: 30, max: 50 },
  { label: '50 - 80 m²', min: 50, max: 80 },
  { label: '80 - 100 m²', min: 80, max: 100 },
  { label: '100 - 150 m²', min: 100, max: 150 },
  { label: '150 - 200 m²', min: 150, max: 200 },
  { label: '200 - 250 m²', min: 200, max: 250 },
  { label: '250 - 300 m²', min: 250, max: 300 },
  { label: '300 - 500 m²', min: 300, max: 500 },
  { label: 'Trên 500 m²', min: 500, max: '' },
];

export default function Search() {
  const locationRouter = useLocation();
  const navigate = useNavigate();

  const provinces = useMemo(() => normalizeProvinces(dvhcvn), []);
  const allDistricts = useMemo(
    () =>
      provinces.flatMap((p) =>
        (getDistricts(p) || []).map((d) => ({
          ...d,
          __provinceName: p.name,
          __provinceObj: p,
        }))
      ),
    [provinces]
  );
  const allWards = useMemo(
    () =>
      provinces.flatMap((p) =>
        (getDistricts(p) || []).flatMap((d) =>
          (getWards(d) || []).map((w) => ({
            ...w,
            __districtName: d.name,
            __provinceName: p.name,
            __districtObj: d,
            __provinceObj: p,
          }))
        )
      ),
    [provinces]
  );

  const [sidebardata, setSidebardata] = useState({
    searchTerm: '',
    type: 'all', // all | rent | sale
    parking: false,
    furnished: false,
    offer: false,
    sort: 'createdAt', // createdAt | regularPrice
    order: 'desc', // asc | desc

    province: '',
    district: '',
    ward: '',

    priceMin: '',
    priceMax: '',
    areaMin: '',
    areaMax: '',
    // true => chỉ tin "Giá thỏa thuận" (priceContact = true)
    priceContactOnly: false,
  });

  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // autocomplete khu vực
  const [provinceInput, setProvinceInput] = useState('');
  const [districtInput, setDistrictInput] = useState('');
  const [wardInput, setWardInput] = useState('');

  const [provinceSuggestions, setProvinceSuggestions] = useState([]);
  const [districtSuggestions, setDistrictSuggestions] = useState([]);
  const [wardSuggestions, setWardSuggestions] = useState([]);

  const [provinceFocused, setProvinceFocused] = useState(false);
  const [districtFocused, setDistrictFocused] = useState(false);
  const [wardFocused, setWardFocused] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // ================== ĐỌC QUERY & FETCH LISTING ==================
  useEffect(() => {
    const urlParams = new URLSearchParams(locationRouter.search);

    const searchTermFromUrl = urlParams.get('searchTerm') || '';
    const typeFromUrl = urlParams.get('type') || 'all';
    const parkingFromUrl = urlParams.get('parking') === 'true';
    const furnishedFromUrl = urlParams.get('furnished') === 'true';
    const offerFromUrl = urlParams.get('offer') === 'true';
    const sortFromUrl = urlParams.get('sort') || 'createdAt';
    const orderFromUrl = urlParams.get('order') || 'desc';

    const provinceFromUrl = urlParams.get('province') || '';
    const districtFromUrl = urlParams.get('district') || '';
    const wardFromUrl = urlParams.get('ward') || '';

    const priceMinFromUrl = urlParams.get('priceMin') || '';
    const priceMaxFromUrl = urlParams.get('priceMax') || '';
    const areaMinFromUrl = urlParams.get('areaMin') || '';
    const areaMaxFromUrl = urlParams.get('areaMax') || '';
    const priceContactOnlyFromUrl =
      urlParams.get('priceContactOnly') === 'true';

    const pageFromUrl = Number(urlParams.get('page')) || 1;
    const limitFromUrl = Number(urlParams.get('limit')) || PAGE_LIMIT;

    // sync state filter
    setSidebardata((prev) => ({
      ...prev,
      searchTerm: searchTermFromUrl,
      type: typeFromUrl,
      parking: parkingFromUrl,
      furnished: furnishedFromUrl,
      offer: offerFromUrl,
      sort: sortFromUrl,
      order: orderFromUrl,
      province: provinceFromUrl,
      district: districtFromUrl,
      ward: wardFromUrl,
      priceMin: priceMinFromUrl,
      priceMax: priceMaxFromUrl,
      areaMin: areaMinFromUrl,
      areaMax: areaMaxFromUrl,
      priceContactOnly: priceContactOnlyFromUrl,
    }));

    setProvinceInput(provinceFromUrl);
    setDistrictInput(districtFromUrl);
    setWardInput(wardFromUrl);

    // map selectedProvince / selectedDistrict theo tên
    if (provinceFromUrl) {
      const p = provinces.find(
        (item) =>
          normalizeText(item.name) === normalizeText(provinceFromUrl)
      );
      setSelectedProvince(p || null);

      if (p && districtFromUrl) {
        const ds = getDistricts(p) || [];
        const d = ds.find(
          (item) =>
            normalizeText(item.name) === normalizeText(districtFromUrl)
        );
        setSelectedDistrict(d || null);
      } else {
        setSelectedDistrict(null);
      }
    } else {
      setSelectedProvince(null);
      setSelectedDistrict(null);
    }

    const fetchListings = async () => {
      try {
        setLoading(true);

        urlParams.set('page', String(pageFromUrl));
        urlParams.set('limit', String(limitFromUrl));

        const searchQuery = urlParams.toString();
        const res = await fetch(`/api/listing/get?${searchQuery}`);
        const data = await res.json();

        let items = [];
        let total = 0;

        if (Array.isArray(data)) {
          items = data;
          total = data.length;
        } else if (data && typeof data === 'object') {
          items = data.items || [];
          total =
            typeof data.total === 'number'
              ? data.total
              : (data.items || []).length;
        }

        setListings(items);
        setCurrentPage(pageFromUrl);

        const computedTotalPages =
          total > 0 ? Math.max(1, Math.ceil(total / limitFromUrl)) : 1;
        setTotalPages(computedTotalPages);
      } catch (err) {
        console.error(err);
        setListings([]);
        setCurrentPage(1);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [locationRouter.search, provinces]);

  // ================== BUILD URL & APPLY FILTER ==================
  const buildSearchUrl = (override = {}) => {
    const data = { ...sidebardata, ...override };
    const params = new URLSearchParams();

    params.set('searchTerm', data.searchTerm || '');
    params.set('type', data.type);
    params.set('parking', String(data.parking));
    params.set('furnished', String(data.furnished));
    params.set('offer', String(data.offer));
    params.set('sort', data.sort);
    params.set('order', data.order);

    if (data.province) params.set('province', data.province);
    if (data.district) params.set('district', data.district);
    if (data.ward) params.set('ward', data.ward);

    if (data.priceMin) params.set('priceMin', data.priceMin);
    if (data.priceMax) params.set('priceMax', data.priceMax);
    if (data.areaMin) params.set('areaMin', data.areaMin);
    if (data.areaMax) params.set('areaMax', data.areaMax);

    if (data.priceContactOnly) {
      params.set('priceContactOnly', 'true');
    }

    params.set('page', '1');
    params.set('limit', String(PAGE_LIMIT));

    return `/search?${params.toString()}`;
  };

  const applyFilters = (patch = {}) => {
    const next = { ...sidebardata, ...patch };
    setSidebardata(next);
    navigate(buildSearchUrl(patch));
  };

  // ================== HANDLERS (BASIC) ==================
  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;

    if (id === 'all' || id === 'rent' || id === 'sale') {
      setSidebardata((prev) => ({ ...prev, type: id }));
      return;
    }

    if (id === 'searchTerm') {
      setSidebardata((prev) => ({ ...prev, searchTerm: value }));
      return;
    }

    if (id === 'parking' || id === 'furnished' || id === 'offer') {
      setSidebardata((prev) => ({
        ...prev,
        [id]: type === 'checkbox' ? checked : value,
      }));
      return;
    }

    if (id === 'sort_order') {
      const [sort, order] = value.split('_');
      setSidebardata((prev) => ({
        ...prev,
        sort: sort || 'createdAt',
        order: order || 'desc',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    const urlParams = new URLSearchParams(locationRouter.search);
    urlParams.set('page', String(page));
    urlParams.set('limit', String(PAGE_LIMIT));

    navigate(`/search?${urlParams.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ================== HANDLERS (LOCATION) ==================
  const handleProvinceChange = (e) => {
    const value = e.target.value;
    setProvinceInput(value);

    setSidebardata((prev) => ({
      ...prev,
      province: value,
      district: '',
      ward: '',
    }));
    setDistrictInput('');
    setWardInput('');
    setSelectedProvince(null);
    setSelectedDistrict(null);

    const norm = normalizeText(value);
    if (!norm) {
      setProvinceSuggestions([]);
      return;
    }

    const matches = provinces
      .filter((p) => normalizeText(p.name).includes(norm))
      .slice(0, 20);
    setProvinceSuggestions(matches);
  };

  const handleSelectProvince = (province) => {
    setProvinceInput(province.name);
    setSidebardata((prev) => ({
      ...prev,
      province: province.name,
      district: '',
      ward: '',
    }));
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setDistrictInput('');
    setWardInput('');
    setProvinceSuggestions([]);
  };

  const handleDistrictChange = (e) => {
    const value = e.target.value;
    setDistrictInput(value);

    setSidebardata((prev) => ({
      ...prev,
      district: value,
      ward: '',
    }));
    setWardInput('');
    setSelectedDistrict(null);

    const source = selectedProvince
      ? getDistricts(selectedProvince) || []
      : allDistricts;

    const norm = normalizeText(value);
    if (!norm) {
      setDistrictSuggestions([]);
      return;
    }

    const matches = source
      .filter((d) => normalizeText(d.name).includes(norm))
      .slice(0, 20);
    setDistrictSuggestions(matches);
  };

  const handleSelectDistrict = (district) => {
    const provinceObj =
      selectedProvince ||
      district.__provinceObj ||
      provinces.find((p) =>
        (getDistricts(p) || []).some((d) => d.name === district.name)
      ) ||
      null;

    if (provinceObj && !sidebardata.province) {
      setProvinceInput(provinceObj.name);
      setSidebardata((prev) => ({
        ...prev,
        province: provinceObj.name,
      }));
      setSelectedProvince(provinceObj);
    }

    setDistrictInput(district.name);
    setSidebardata((prev) => ({
      ...prev,
      district: district.name,
      ward: '',
    }));
    setSelectedDistrict(district);
    setWardInput('');
    setDistrictSuggestions([]);
  };

  const handleWardChange = (e) => {
    const value = e.target.value;
    setWardInput(value);

    setSidebardata((prev) => ({
      ...prev,
      ward: value,
    }));

    const source = selectedDistrict ? getWards(selectedDistrict) || [] : allWards;

    const norm = normalizeText(value);
    if (!norm) {
      setWardSuggestions([]);
      return;
    }

    const matches = source
      .filter((w) => normalizeText(w.name).includes(norm))
      .slice(0, 30);
    setWardSuggestions(matches);
  };

  const handleSelectWard = (ward) => {
    const districtObj =
      selectedDistrict || ward.__districtObj || null;
    const provinceObj =
      selectedProvince ||
      ward.__provinceObj ||
      (districtObj &&
        provinces.find((p) =>
          (getDistricts(p) || []).some((d) => d.name === districtObj.name)
        )) ||
      null;

    if (provinceObj && !sidebardata.province) {
      setProvinceInput(provinceObj.name);
      setSidebardata((prev) => ({
        ...prev,
        province: provinceObj.name,
      }));
      setSelectedProvince(provinceObj);
    }

    if (districtObj && !sidebardata.district) {
      setDistrictInput(districtObj.name);
      setSidebardata((prev) => ({
        ...prev,
        district: districtObj.name,
      }));
      setSelectedDistrict(districtObj);
    }

    setWardInput(ward.name);
    setSidebardata((prev) => ({
      ...prev,
      ward: ward.name,
    }));
    setWardSuggestions([]);
  };

  // ================== HANDLERS (PRICE / AREA RANGE) ==================
  const isActivePriceRange = (range) => {
    const isGiaThoaThuan = range.label === 'Giá thỏa thuận';

    // "Giá thỏa thuận" active khi đang bật priceContactOnly
    if (isGiaThoaThuan) {
      return sidebardata.priceContactOnly === true;
    }

    // các khoảng giá số: active khi min/max trùng và không bật priceContactOnly
    const minStr =
      sidebardata.priceMin !== '' && sidebardata.priceMin != null
        ? String(sidebardata.priceMin)
        : '';
    const maxStr =
      sidebardata.priceMax !== '' && sidebardata.priceMax != null
        ? String(sidebardata.priceMax)
        : '';

    const rMinStr =
      range.min !== '' && range.min != null ? String(range.min) : '';
    const rMaxStr =
      range.max !== '' && range.max != null ? String(range.max) : '';

    return (
      sidebardata.priceContactOnly === false &&
      minStr === rMinStr &&
      maxStr === rMaxStr
    );
  };

  const isActiveAreaRange = (range) => {
    const minStr =
      sidebardata.areaMin !== '' && sidebardata.areaMin != null
        ? String(sidebardata.areaMin)
        : '';
    const maxStr =
      sidebardata.areaMax !== '' && sidebardata.areaMax != null
        ? String(sidebardata.areaMax)
        : '';

    const rMinStr =
      range.min !== '' && range.min != null ? String(range.min) : '';
    const rMaxStr =
      range.max !== '' && range.max != null ? String(range.max) : '';

    return minStr === rMinStr && maxStr === rMaxStr;
  };

  const handlePriceRangeClick = (range) => {
    const isGiaThoaThuan = range.label === 'Giá thỏa thuận';

    // nếu đang active -> bấm lại để reset toàn bộ filter giá
    if (isActivePriceRange(range)) {
      applyFilters({
        priceMin: '',
        priceMax: '',
        priceContactOnly: false,
      });
      return;
    }

    // "Giá thỏa thuận": chỉ hiện tin priceContact = true
    if (isGiaThoaThuan) {
      applyFilters({
        priceMin: '',
        priceMax: '',
        priceContactOnly: true,
      });
      return;
    }

    // các khoảng giá số
    applyFilters({
      priceMin:
        range.min !== '' && range.min != null ? String(range.min) : '',
      priceMax:
        range.max !== '' && range.max != null ? String(range.max) : '',
      priceContactOnly: false,
    });
  };

  const handleAreaRangeClick = (range) => {
    const active = isActiveAreaRange(range);
    if (active) {
      applyFilters({ areaMin: '', areaMax: '' });
      return;
    }

    applyFilters({
      areaMin:
        range.min !== '' && range.min != null ? String(range.min) : '',
      areaMax:
        range.max !== '' && range.max != null ? String(range.max) : '',
    });
  };

  // =========== TÍNH LIST SỐ TRANG: 1 … 6 7 8 9 10 … 30 ===========
  const buildPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
      return pages;
    }

    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);

    if (left > 2) {
      pages.push('left-ellipsis');
    }

    for (let i = left; i <= right; i += 1) {
      pages.push(i);
    }

    if (right < totalPages - 1) {
      pages.push('right-ellipsis');
    }

    pages.push(totalPages);

    return pages;
  };

  // Chọn card theo loại tin
  const renderListingCard = (listing) => {
    const type = listing?.listingType || 'normal';
    if (type === 'premium') {
      return <ListingCardPremium key={listing._id} listing={listing} />;
    }
    if (type === 'vip') {
      return <ListingCardVip key={listing._id} listing={listing} />;
    }
    return <ListingCardNormal key={listing._id} listing={listing} />;
  };

  // ================== UI ==================
  return (
    <div className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-6">
      {/* FORM TÌM KIẾM + FILTER TRÊN ĐẦU */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4"
      >
        {/* Hàng 1: từ khoá + tỉnh/quận/phường + loại giao dịch */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {/* Từ khoá */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Từ khoá (tìm theo tên / tiêu đề)
            </label>
            <input
              type="text"
              id="searchTerm"
              placeholder="VD: Nhà phố Hóc Môn, căn hộ 2PN ..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
              value={sidebardata.searchTerm}
              onChange={handleChange}
            />
          </div>

          {/* Tỉnh / Thành phố */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Tỉnh / Thành phố
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="VD: Thành phố Hồ Chí Minh"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                value={provinceInput}
                onChange={handleProvinceChange}
                onFocus={() => {
                  setProvinceFocused(true);
                  if (!provinceSuggestions.length) {
                    setProvinceSuggestions(provinces.slice(0, 20));
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setProvinceFocused(false), 150);
                }}
              />
              {provinceFocused && provinceSuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg text-sm">
                  {provinceSuggestions.map((opt) => (
                    <button
                      key={opt.code || opt.name}
                      type="button"
                      onClick={() => handleSelectProvince(opt)}
                      className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="text-slate-800">{opt.name}</span>
                      <span className="text-[11px] text-slate-400 uppercase">
                        Tỉnh / Thành phố
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quận / Huyện */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Quận / Huyện
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="VD: Quận 8, Huyện Hóc Môn..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                value={districtInput}
                onChange={handleDistrictChange}
                onFocus={() => {
                  setDistrictFocused(true);
                  if (!districtSuggestions.length) {
                    const source = selectedProvince
                      ? getDistricts(selectedProvince) || []
                      : allDistricts;
                    setDistrictSuggestions(source.slice(0, 20));
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setDistrictFocused(false), 150);
                }}
              />
              {districtFocused && districtSuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg text-sm">
                  {districtSuggestions.map((opt) => (
                    <button
                      key={opt.code || opt.name}
                      type="button"
                      onClick={() => handleSelectDistrict(opt)}
                      className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="text-slate-800">{opt.name}</span>
                      <span className="text-[11px] text-slate-400 uppercase">
                        {opt.__provinceName
                          ? `Thuộc: ${opt.__provinceName}`
                          : 'Quận / Huyện'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Phường / Xã */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Phường / Xã
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="VD: Phường 7, Xã Bà Điểm..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                value={wardInput}
                onChange={handleWardChange}
                onFocus={() => {
                  setWardFocused(true);
                  if (!wardSuggestions.length) {
                    const source = selectedDistrict
                      ? getWards(selectedDistrict) || []
                      : allWards;
                    setWardSuggestions(source.slice(0, 30));
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setWardFocused(false), 150);
                }}
              />
              {wardFocused && wardSuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg text-sm">
                  {wardSuggestions.map((opt) => (
                    <button
                      key={opt.code || opt.name}
                      type="button"
                      onClick={() => handleSelectWard(opt)}
                      className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="text-slate-800">{opt.name}</span>
                      <span className="text-[11px] text-slate-400 uppercase">
                        {opt.__districtName && opt.__provinceName
                          ? `Thuộc: ${opt.__districtName}, ${opt.__provinceName}`
                          : 'Phường / Xã'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Loại giao dịch */}
          <div className="mt-2 flex flex-wrap gap-3 text-xs md:text-sm lg:mt-0">
            <span className="text-xs font-medium text-slate-600 mt-1">
              Loại giao dịch
            </span>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                id="all"
                name="type"
                checked={sidebardata.type === 'all'}
                onChange={handleChange}
              />
              <span>Tất cả</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                id="rent"
                name="type"
                checked={sidebardata.type === 'rent'}
                onChange={handleChange}
              />
              <span>Cho thuê</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                id="sale"
                name="type"
                checked={sidebardata.type === 'sale'}
                onChange={handleChange}
              />
              <span>Bán</span>
            </label>
          </div>
        </div>

        {/* Hàng 2: tiện ích + sort + nút lọc */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* tiện ích */}
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
            <span className="font-medium text-slate-600">Tiện ích</span>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                id="parking"
                checked={sidebardata.parking}
                onChange={handleChange}
              />
              <span>Bãi đỗ xe</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                id="furnished"
                checked={sidebardata.furnished}
                onChange={handleChange}
              />
              <span>Nội thất</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                id="offer"
                checked={sidebardata.offer}
                onChange={handleChange}
              />
              <span>Chỉ tin có ưu đãi</span>
            </label>
          </div>

          {/* sort + submit */}
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span className="font-medium text-slate-600">Sắp xếp</span>
            <select
              id="sort_order"
              className="border rounded-lg px-2 py-1.5 text-xs md:text-sm outline-none"
              value={`${sidebardata.sort}_${sidebardata.order}`}
              onChange={handleChange}
            >
              <option value="regularPrice_desc">Giá cao → thấp</option>
              <option value="regularPrice_asc">Giá thấp → cao</option>
              <option value="createdAt_desc">Mới nhất</option>
              <option value="createdAt_asc">Cũ nhất</option>
            </select>

            <button
              type="submit"
              className="ml-3 bg-slate-900 text-white rounded-lg px-4 py-1.5 text-xs md:text-sm font-semibold hover:opacity-90"
            >
              Lọc kết quả
            </button>
          </div>
        </div>
      </form>

      {/* GRID: KẾT QUẢ (TRÁI) + FILTER GIÁ/DIỆN TÍCH (PHẢI) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.3fr)_minmax(260px,1fr)] gap-5">
        {/* LEFT: LISTING CARDS */}
        <div>
          <div className="space-y-3">
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 mb-1">
              Kết quả tìm kiếm
            </h1>

            {loading && (
              <p className="text-sm text-slate-500">Đang tải dữ liệu…</p>
            )}

            {!loading && listings.length === 0 && (
              <p className="text-sm text-slate-500">
                Không tìm thấy bất động sản phù hợp.
              </p>
            )}

            {!loading &&
              listings &&
              listings.map((listing) => renderListingCard(listing))}
          </div>

          {/* PAGINATION */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-1 text-xs md:text-sm">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                >
                  ‹
                </button>

                {buildPageNumbers().map((item, idx) => {
                  if (item === 'left-ellipsis' || item === 'right-ellipsis') {
                    return (
                      <span
                        key={item + idx}
                        className="px-2 py-1 text-slate-400 select-none"
                      >
                        …
                      </span>
                    );
                  }

                  const page = item;
                  const isActive = page === currentPage;

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 rounded-full border text-xs md:text-sm ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: FILTER GIÁ & DIỆN TÍCH */}
        <aside className="lg:pl-1">
          <div className="sticky top-24 space-y-4">
            {/* Giá */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4">
              <h2 className="text-sm font-semibold text-slate-800 mb-2">
                Khoảng giá
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {PRICE_RANGES.map((range) => {
                  const active = isActivePriceRange(range);
                  return (
                    <button
                      key={range.label}
                      type="button"
                      onClick={() => handlePriceRangeClick(range)}
                      className={`rounded-full border px-3 py-1.5 text-left ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                • Chọn khoảng giá để lọc theo giá bán / cho thuê.{'\n'}
                • Chọn &quot;Giá thỏa thuận&quot; để chỉ xem tin liên hệ để biết giá.{'\n'}
                • Bấm lại một khoảng đang chọn để bỏ lọc giá.
              </p>
            </div>

            {/* Diện tích */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4">
              <h2 className="text-sm font-semibold text-slate-800 mb-2">
                Diện tích
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {AREA_RANGES.map((range) => {
                  const active = isActiveAreaRange(range);
                  return (
                    <button
                      key={range.label}
                      type="button"
                      onClick={() => handleAreaRangeClick(range)}
                      className={`rounded-full border px-3 py-1.5 text-left ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Bấm lại lần nữa để bỏ chọn khoảng diện tích.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
