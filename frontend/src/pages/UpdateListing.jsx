// src/pages/UpdateListing.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { uploadToCloudinary } from '../utils/cloudinary';
import { toast } from 'react-hot-toast';
import regions from '../data/dvhcvn.json';

const MAX_IMAGES = 30;

// Cấu hình loại tin (chỉ để hiển thị label / mô tả)
const LISTING_TYPE_CONFIG = {
  normal: {
    label: 'Tin thường',
    description:
      'Hiển thị tiêu chuẩn. Thông tin liên hệ chủ yếu xem trong trang chi tiết.',
  },
  vip: {
    label: 'Tin VIP',
    description:
      'Ưu tiên hiển thị hơn tin thường, card nổi bật. Thông tin liên hệ xuất hiện ngoài trang danh sách.',
  },
  premium: {
    label: 'Tin Premium',
    description:
      'Vị trí top, card lớn, layout ảnh đẹp. Luôn hiển thị thông tin liên hệ và ưu tiên cao nhất.',
  },
};

// Chuẩn hoá dvhcvn.json (top-level)
const normalizeProvinces = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (raw?.provinces) return raw.provinces;
  if (raw?.data) return raw.data;
  if (raw?.items) return raw.items;
  return [];
};

// Lấy quận / huyện từ 1 tỉnh/thành
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

// Lấy phường / xã từ 1 quận/huyện
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

const buildAddress = (houseNumber, wardName, districtName, provinceName) => {
  const parts = [];
  if (houseNumber) parts.push(houseNumber);
  if (wardName) parts.push(wardName);
  if (districtName) parts.push(districtName);
  if (provinceName) parts.push(provinceName);
  return parts.join(', ');
};

// bỏ dấu + lowercase để search cho dễ
const normalizeText = (str = '') =>
  str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// Parse chuỗi VN price -> số VND (best effort)
const parseVnPriceToNumber = (raw) => {
  if (!raw) return 0;
  const lower = raw.toString().toLowerCase().trim();

  // bỏ chữ không cần thiết
  const cleaned = lower
    .replace(/đ|vnd|vnđ|,/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // tỷ
  if (cleaned.includes('tỷ') || cleaned.includes('ty')) {
    const numStr = cleaned.split(/tỷ|ty/)[0].trim();
    const num = parseFloat(numStr.replace(/\s/g, ''));
    if (!Number.isNaN(num) && num > 0) return Math.round(num * 1_000_000_000);
  }

  // triệu
  if (cleaned.includes('triệu') || cleaned.includes('tr')) {
    const numStr = cleaned.split(/triệu|tr/)[0].trim();
    const num = parseFloat(numStr.replace(/\s/g, ''));
    if (!Number.isNaN(num) && num > 0) return Math.round(num * 1_000_000);
  }

  // chỉ số: coi như VND
  const onlyNum = cleaned.replace(/[^\d.]/g, '');
  if (!onlyNum) return 0;
  const num = parseFloat(onlyNum);
  if (Number.isNaN(num) || num <= 0) return 0;
  return Math.round(num);
};

export default function UpdateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const me = currentUser?.rest ?? currentUser ?? null;
  const navigate = useNavigate();
  const params = useParams();

  const provinces = useMemo(() => normalizeProvinces(regions), []);

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);

  const [provinceSuggestions, setProvinceSuggestions] = useState([]);
  const [districtSuggestions, setDistrictSuggestions] = useState([]);
  const [wardSuggestions, setWardSuggestions] = useState([]);

  const [provinceFocused, setProvinceFocused] = useState(false);
  const [districtFocused, setDistrictFocused] = useState(false);
  const [wardFocused, setWardFocused] = useState(false);

  const [files, setFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    imageUrls: [],

    // loại tin
    listingType: 'normal', // normal | vip | premium

    // cơ bản
    name: '',
    description: '',
    type: 'rent', // rent | sale

    // địa chỉ chi tiết
    province: '',
    district: '',
    ward: '',
    houseNumber: '',
    address: '',

    // info cũ
    bedrooms: 1,
    bathrooms: 1,

    // giá numeric
    regularPrice: 0,
    discountPrice: 0,
    offer: false,

    // hiển thị giá
    priceDisplay: '', // text người dùng nhập: "700 triệu", "4.5 tỷ"
    priceContact: false, // nếu true => 'Liên hệ'
    discountPriceDisplay: '', // text ưu đãi: "650 triệu", "1.8 tỷ"

    parking: false,
    furnished: false,

    // chi tiết thêm
    area: '',
    legalStatus: '',
    direction: '',
    alleyWidth: '',
    width: '',
    length: '',
    floors: '',
    toilets: '',

    // liên hệ
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactZalo: '',
  });

  const currentConfig = useMemo(
    () =>
      LISTING_TYPE_CONFIG[formData.listingType] ||
      LISTING_TYPE_CONFIG.normal,
    [formData.listingType]
  );

  // Prefill contact info từ user nếu form còn trống
  useEffect(() => {
    if (!me) return;
    setFormData((prev) => ({
      ...prev,
      contactName: prev.contactName || me.username || '',
      contactPhone: prev.contactPhone || me.phone || '',
      contactEmail: prev.contactEmail || me.email || '',
    }));
  }, [me]);

  // Sync selectedProvince / District / Ward từ text
  useEffect(() => {
    if (!formData.province) {
      setSelectedProvince(null);
      return;
    }
    const provinceObj = provinces.find((p) => p.name === formData.province);
    setSelectedProvince(provinceObj || null);
  }, [formData.province, provinces]);

  useEffect(() => {
    if (!selectedProvince || !formData.district) {
      setSelectedDistrict(null);
      return;
    }
    const allDistricts = getDistricts(selectedProvince);
    const districtObj = allDistricts.find((d) => d.name === formData.district);
    setSelectedDistrict(districtObj || null);
  }, [formData.district, selectedProvince]);

  useEffect(() => {
    if (!selectedDistrict || !formData.ward) {
      setSelectedWard(null);
      return;
    }
    const allWards = getWards(selectedDistrict);
    const wardObj = allWards.find((w) => w.name === formData.ward);
    setSelectedWard(wardObj || null);
  }, [formData.ward, selectedDistrict]);

  // Fetch dữ liệu bài đăng
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setError('');
        const res = await fetch(`/api/listing/edit/${params.listingId}`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (!res.ok || data?.success === false) {
          setError(data?.message || 'Không tải được bài đăng');
          return;
        }

        setImageUrls(Array.isArray(data.imageUrls) ? data.imageUrls : []);

        setFormData((prev) => {
          const province = data.province || prev.province || '';
          const district = data.district || prev.district || '';
          const ward = data.ward || prev.ward || '';
          const houseNumber = data.houseNumber || prev.houseNumber || '';
          const address =
            data.address ||
            prev.address ||
            buildAddress(houseNumber, ward, district, province);

          return {
            ...prev,
            ...data,
            listingType: data.listingType || 'normal',
            priceDisplay:
              data.priceDisplay || data.priceDisplay === ''
                ? data.priceDisplay
                : prev.priceDisplay,
            priceContact: !!data.priceContact,
            discountPriceDisplay:
              data.discountPriceDisplay ||
              data.discountPriceDisplay === ''
                ? data.discountPriceDisplay
                : prev.discountPriceDisplay,
            province,
            district,
            ward,
            houseNumber,
            address,
          };
        });
      } catch (e) {
        console.error(e);
        setError('Không tải được bài đăng');
      }
    };

    if (params.listingId) {
      fetchListing();
    }
  }, [params.listingId]);

  // ============ ẢNH ============
  const handleImageSubmit = async () => {
    setError('');
    if (!files || files.length === 0) return;

    const remain = MAX_IMAGES - imageUrls.length;

    if (remain <= 0) {
      setError(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh cho một tin.`);
      return;
    }

    if (files.length > remain) {
      setError(
        `Bạn chỉ có thể thêm tối đa ${remain} ảnh nữa (tổng ${MAX_IMAGES} ảnh).`
      );
      return;
    }

    try {
      setUploading(true);
      const tasks = [];
      for (let i = 0; i < files.length; i += 1) {
        tasks.push(uploadToCloudinary(files[i]));
      }
      const urls = await Promise.all(tasks);
      const next = [...imageUrls, ...urls];
      setImageUrls(next);
      setFormData((prev) => ({ ...prev, imageUrls: next }));
    } catch (e) {
      console.error('Upload error:', e);
      setError(e.message || 'Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (idx) => {
    const next = imageUrls.filter((_, i) => i !== idx);
    setImageUrls(next);
    setFormData((prev) => ({ ...prev, imageUrls: next }));
  };

  const handleMakeCover = (idx) => {
    if (idx === 0) return;
    const next = [...imageUrls];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    setImageUrls(next);
    setFormData((prev) => ({ ...prev, imageUrls: next }));
  };

  // ============ HANDLE CHANGE ============
  const handleChange = (e) => {
    const { id, type, value, checked } = e.target;

    // loại giao dịch (bán / cho thuê)
    if (id === 'sale' || id === 'rent') {
      setFormData((prev) => ({
        ...prev,
        type: id,
      }));
      return;
    }

    // checkbox boolean
    if (id === 'parking' || id === 'furnished' || id === 'offer') {
      setFormData((prev) => ({
        ...prev,
        [id]: checked,
      }));
      return;
    }

    // checkbox "Liên hệ để biết giá"
    if (id === 'priceContact') {
      setFormData((prev) => ({
        ...prev,
        priceContact: checked,
      }));
      return;
    }

    // Giá hiển thị (chuỗi): "700 triệu", "4.5 tỷ"
    if (id === 'priceDisplay') {
      const text = value;
      const numeric = parseVnPriceToNumber(text);
      setFormData((prev) => ({
        ...prev,
        priceDisplay: text,
        regularPrice: numeric,
      }));
      return;
    }

    // Giá ưu đãi hiển thị (chuỗi)
    if (id === 'discountPriceDisplay') {
      const text = value;
      const numeric = parseVnPriceToNumber(text);
      setFormData((prev) => ({
        ...prev,
        discountPriceDisplay: text,
        discountPrice: numeric,
      }));
      return;
    }

    // còn lại
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'number' ? Number(value) : value,
    }));
  };

  // ============ ĐỊA CHỈ: autocomplete 3 cấp giống CreateListing ============

  // Lấy toàn bộ quận/huyện kèm tỉnh cha (dùng khi chưa chọn tỉnh)
  const getAllDistrictsWithProvince = () => {
    return provinces.flatMap((p) =>
      (getDistricts(p) || []).map((d) => ({
        ...d,
        __provinceName: p.name,
        __provinceObj: p,
      }))
    );
  };

  // Lấy toàn bộ phường/xã kèm quận + tỉnh cha
  const getAllWardsWithParents = () => {
    return provinces.flatMap((p) =>
      (getDistricts(p) || []).flatMap((d) =>
        (getWards(d) || []).map((w) => ({
          ...w,
          __districtName: d.name,
          __provinceName: p.name,
          __districtObj: d,
          __provinceObj: p,
        }))
      )
    );
  };

  const handleProvinceInputChange = (e) => {
    const value = e.target.value;
    const norm = normalizeText(value);

    // reset
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistrictSuggestions([]);
    setWardSuggestions([]);

    const address = buildAddress(formData.houseNumber, '', '', value || '');

    setFormData((prev) => ({
      ...prev,
      province: value,
      district: '',
      ward: '',
      address,
    }));

    if (!norm) {
      setProvinceSuggestions(provinces.slice(0, 20));
      return;
    }

    const matches = provinces
      .filter((p) => normalizeText(p.name).includes(norm))
      .slice(0, 20);

    setProvinceSuggestions(matches);
  };

  const handleSelectProvince = (province) => {
    const provinceName = province?.name || '';

    const address = buildAddress(formData.houseNumber, '', '', provinceName);

    setSelectedProvince(province || null);
    setSelectedDistrict(null);
    setSelectedWard(null);

    setFormData((prev) => ({
      ...prev,
      province: provinceName,
      district: '',
      ward: '',
      address,
    }));

    setProvinceSuggestions([]);
  };

  const handleDistrictInputChange = (e) => {
    const value = e.target.value;
    const norm = normalizeText(value);

    const address = buildAddress(
      formData.houseNumber,
      '',
      value || '',
      formData.province
    );

    setSelectedDistrict(null);
    setSelectedWard(null);
    setWardSuggestions([]);

    setFormData((prev) => ({
      ...prev,
      district: value,
      ward: '',
      address,
    }));

    let allDistricts = [];

    if (selectedProvince) {
      allDistricts = getDistricts(selectedProvince) || [];
    } else {
      allDistricts = getAllDistrictsWithProvince();
    }

    if (!norm) {
      setDistrictSuggestions(allDistricts.slice(0, 30));
      return;
    }

    const matches = allDistricts
      .filter((d) => normalizeText(d.name).includes(norm))
      .slice(0, 30);

    setDistrictSuggestions(matches);
  };

  const handleSelectDistrict = (district) => {
    const districtName = district?.name || '';

    const provinceObj =
      selectedProvince || district.__provinceObj || null;
    const provinceName =
      provinceObj?.name || district.__provinceName || formData.province || '';

    const address = buildAddress(
      formData.houseNumber,
      '',
      districtName,
      provinceName
    );

    setSelectedProvince(provinceObj);
    setSelectedDistrict(district || null);
    setSelectedWard(null);

    setFormData((prev) => ({
      ...prev,
      province: provinceName,
      district: districtName,
      ward: '',
      address,
    }));

    setDistrictSuggestions([]);
  };

  const handleWardInputChange = (e) => {
    const value = e.target.value;
    const norm = normalizeText(value);

    const address = buildAddress(
      formData.houseNumber,
      value || '',
      formData.district,
      formData.province
    );

    setFormData((prev) => ({
      ...prev,
      ward: value,
      address,
    }));

    let allWards = [];

    if (selectedDistrict) {
      allWards = getWards(selectedDistrict) || [];
    } else {
      allWards = getAllWardsWithParents();
    }

    if (!norm) {
      setWardSuggestions(allWards.slice(0, 40));
      return;
    }

    const matches = allWards
      .filter((w) => normalizeText(w.name).includes(norm))
      .slice(0, 40);

    setWardSuggestions(matches);
  };

  const handleSelectWard = (ward) => {
    const wardName = ward?.name || '';

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

    const districtName =
      districtObj?.name || ward.__districtName || formData.district || '';
    const provinceName =
      provinceObj?.name || ward.__provinceName || formData.province || '';

    const address = buildAddress(
      formData.houseNumber,
      wardName,
      districtName,
      provinceName
    );

    setSelectedProvince(provinceObj);
    setSelectedDistrict(districtObj);
    setSelectedWard(ward || null);

    setFormData((prev) => ({
      ...prev,
      province: provinceName,
      district: districtName,
      ward: wardName,
      address,
    }));

    setWardSuggestions([]);
  };

  const handleHouseNumberChange = (e) => {
    const value = e.target.value;
    const address = buildAddress(
      value,
      formData.ward,
      formData.district,
      formData.province
    );
    setFormData((prev) => ({
      ...prev,
      houseNumber: value,
      address,
    }));
  };

  // ============ SUBMIT ============
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!currentUser) {
        setError('Bạn cần đăng nhập để cập nhật bài đăng');
        return;
      }

      if (imageUrls.length < 1) {
        setError('Bạn cần có ít nhất 1 ảnh');
        return;
      }

      if (!formData.address.trim()) {
        setError(
          'Vui lòng nhập đủ địa chỉ (Tỉnh/TP, Quận/Huyện, Phường/Xã, Số nhà)'
        );
        return;
      }

      if (!formData.area || Number(formData.area) <= 0) {
        setError('Vui lòng nhập Diện tích hợp lệ');
        return;
      }

      if (!formData.legalStatus?.trim()) {
        setError(
          'Vui lòng nhập Pháp lý (VD: Sổ hồng, Sổ đỏ, HĐ mua bán...)'
        );
        return;
      }

      // Nếu KHÔNG chọn "Liên hệ" thì phải có giá > 0
      if (!formData.priceContact) {
        if (!formData.regularPrice || Number(formData.regularPrice) <= 0) {
          setError(
            'Vui lòng nhập Mức giá hợp lệ hoặc chọn "Liên hệ để biết giá".'
          );
          return;
        }
      }

      // Nếu có ưu đãi & không phải "Liên hệ" -> discount < regular
      if (formData.offer && !formData.priceContact) {
        if (Number(formData.regularPrice) < Number(formData.discountPrice)) {
          setError('Giá khuyến mãi phải thấp hơn giá thông thường');
          return;
        }
      }

      setLoading(true);

      const listingData = {
        ...formData,
        imageUrls,
        userRef: currentUser?.rest?._id || currentUser._id,
        discountPrice:
          formData.offer && !formData.priceContact
            ? Number(formData.discountPrice || 0)
            : 0,
      };

      const res = await fetch(`/api/listing/update/${params.listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(listingData),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || data?.success === false) {
        setError(data?.message || `Lỗi cập nhật (HTTP ${res.status})`);
        return;
      }

      toast.success(
        'Đã cập nhật bài đăng. Vui lòng chờ quản trị viên duyệt lại.'
      );
      navigate('/profile');
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError(e.message || 'Đã có lỗi xảy ra');
    }
  };

  // ============ UI ============
  return (
    <main className="p-3 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">
        Cập nhật bài đăng
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-4">
        {/* Cột trái: thông tin */}
        <div className="flex flex-col gap-4 flex-[2]">
          {/* Loại tin (chỉ xem, không cho đổi ở đây) */}
          <div className="border rounded-lg p-3 text-sm">
            <p className="font-semibold mb-1">Loại tin</p>
            <p className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700">
              {currentConfig.label}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {currentConfig.description}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Thay đổi loại tin (Thường / VIP / Premium) được thực hiện qua
              trang nâng cấp gói hoặc bởi quản trị viên.
            </p>
            <Link
              to="/pricing"
              className="mt-1 inline-block text-[11px] text-emerald-600 hover:underline"
            >
              Xem các gói VIP / Premium
            </Link>
          </div>

          {/* Tiêu đề & mô tả */}
          <input
            type="text"
            placeholder="Tiêu đề bài đăng"
            id="name"
            required
            minLength={10}
            className="border p-3 rounded-lg"
            onChange={handleChange}
            value={formData.name}
          />

          <textarea
            id="description"
            placeholder="Mô tả chi tiết bất động sản"
            className="border p-3 rounded-lg h-28 resize-vertical"
            onChange={handleChange}
            value={formData.description}
            required
          />

          {/* Địa chỉ với autocomplete 3 cấp */}
          <div className="border rounded-lg p-3 space-y-3">
            <p className="font-semibold text-sm mb-1">Địa chỉ</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Province */}
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Tỉnh / Thành phố
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="province"
                    className="w-full border rounded-lg px-2 py-2 text-sm"
                    value={formData.province}
                    onChange={handleProvinceInputChange}
                    placeholder="VD: Thành phố Hồ Chí Minh"
                    onFocus={() => {
                      setProvinceFocused(true);
                      setProvinceSuggestions(provinces.slice(0, 20));
                    }}
                    onBlur={() => {
                      setTimeout(() => setProvinceFocused(false), 150);
                    }}
                  />
                  {provinceFocused && provinceSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg text-sm">
                      {provinceSuggestions.map((p) => (
                        <button
                          type="button"
                          key={p.code || p.name}
                          onClick={() => handleSelectProvince(p)}
                          className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
                        >
                          <span className="text-slate-800">{p.name}</span>
                          <span className="text-[11px] text-slate-400">
                            Tỉnh / Thành phố
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Quận / Huyện
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="district"
                    className="w-full border rounded-lg px-2 py-2 text-sm"
                    value={formData.district}
                    onChange={handleDistrictInputChange}
                    placeholder={
                      selectedProvince
                        ? 'VD: Quận 1, Huyện Hóc Môn...'
                        : 'Có thể gõ trực tiếp hoặc chọn tỉnh trước'
                    }
                    onFocus={() => {
                      setDistrictFocused(true);
                      let allDistricts = [];
                      if (selectedProvince) {
                        allDistricts = getDistricts(selectedProvince) || [];
                      } else {
                        allDistricts = getAllDistrictsWithProvince();
                      }
                      setDistrictSuggestions(allDistricts.slice(0, 30));
                    }}
                    onBlur={() => {
                      setTimeout(() => setDistrictFocused(false), 150);
                    }}
                  />
                  {districtFocused && districtSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg text-sm">
                      {districtSuggestions.map((d) => (
                        <button
                          type="button"
                          key={d.code || d.name}
                          onClick={() => handleSelectDistrict(d)}
                          className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
                        >
                          <span className="text-slate-800">{d.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {d.__provinceName
                              ? `Thuộc: ${d.__provinceName}`
                              : 'Quận / Huyện'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ward */}
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Phường / Xã
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="ward"
                    className="w-full border rounded-lg px-2 py-2 text-sm"
                    value={formData.ward}
                    onChange={handleWardInputChange}
                    placeholder={
                      selectedDistrict
                        ? 'VD: Phường 7, Xã Bà Điểm...'
                        : 'Có thể gõ trực tiếp hoặc chọn quận trước'
                    }
                    onFocus={() => {
                      setWardFocused(true);
                      let allWards = [];
                      if (selectedDistrict) {
                        allWards = getWards(selectedDistrict) || [];
                      } else {
                        allWards = getAllWardsWithParents();
                      }
                      setWardSuggestions(allWards.slice(0, 40));
                    }}
                    onBlur={() => {
                      setTimeout(() => setWardFocused(false), 150);
                    }}
                  />
                  {wardFocused && wardSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg text-sm">
                      {wardSuggestions.map((w) => (
                        <button
                          type="button"
                          key={w.code || w.name}
                          onClick={() => handleSelectWard(w)}
                          className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
                        >
                          <span className="text-slate-800">{w.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {w.__districtName && w.__provinceName
                              ? `Thuộc: ${w.__districtName}, ${w.__provinceName}`
                              : 'Phường / Xã'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Số nhà / Hẻm / Đường (VD: 42/4P)
                </label>
                <input
                  type="text"
                  id="houseNumber"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.houseNumber}
                  onChange={handleHouseNumberChange}
                />
              </div>

              <div className="flex flex-col justify-end text-xs text-slate-600">
                <span className="font-medium">Địa chỉ hiển thị:</span>
                <span className="mt-1">
                  {formData.address
                    ? formData.address
                    : 'Chưa đủ thông tin để tạo địa chỉ đầy đủ'}
                </span>
              </div>
            </div>
          </div>

          {/* Loại giao dịch & options */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <input
                onChange={handleChange}
                checked={formData.type === 'sale'}
                type="checkbox"
                id="sale"
                className="w-5 h-5"
              />
              <label htmlFor="sale">Bán</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                onChange={handleChange}
                checked={formData.type === 'rent'}
                type="checkbox"
                id="rent"
                className="w-5 h-5"
              />
              <label htmlFor="rent">Cho thuê</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                onChange={handleChange}
                checked={formData.parking}
                type="checkbox"
                id="parking"
                className="w-5 h-5"
              />
              <label htmlFor="parking">Gara</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                onChange={handleChange}
                checked={formData.furnished}
                type="checkbox"
                id="furnished"
                className="w-5 h-5"
              />
              <label htmlFor="furnished">Nội thất</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                onChange={handleChange}
                checked={formData.offer}
                type="checkbox"
                id="offer"
                className="w-5 h-5"
              />
              <label htmlFor="offer">Có ưu đãi</label>
            </div>
          </div>

          {/* Chi tiết */}
          <div className="border rounded-lg p-3 space-y-3">
            <p className="font-semibold text-sm mb-1">Chi tiết</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Diện tích (m²) *
                </label>
                <input
                  type="number"
                  id="area"
                  min={0}
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.area}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Pháp lý *
                </label>
                <input
                  type="text"
                  id="legalStatus"
                  placeholder="VD: Sổ hồng, Sổ đỏ, HĐ mua bán..."
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.legalStatus}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Hướng
                </label>
                <input
                  type="text"
                  id="direction"
                  placeholder="Đông, Tây, Đông Nam..."
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.direction}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Hẻm (m)
                </label>
                <input
                  type="number"
                  id="alleyWidth"
                  min={0}
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.alleyWidth}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Rộng (m)
                </label>
                <input
                  type="number"
                  id="width"
                  min={0}
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.width}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Dài (m)
                </label>
                <input
                  type="number"
                  id="length"
                  min={0}
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.length}
                  onChange={handleChange}
                />
              </div>

              <div className="flex flex-col justify-end text-xs text-slate-600">
                <span>
                  Rộng x Dài:{' '}
                  <strong>
                    {formData.width || '-'} x {formData.length || '-'}
                  </strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Số tầng
                </label>
                <input
                  type="number"
                  id="floors"
                  min={0}
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.floors}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Số toilet
                </label>
                <input
                  type="number"
                  id="toilets"
                  min={0}
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.toilets}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Phòng ngủ
                </label>
                <input
                  type="number"
                  id="bedrooms"
                  min={0}
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.bedrooms}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Phòng tắm
                </label>
                <input
                  type="number"
                  id="bathrooms"
                  min={0}
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.bathrooms}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Mức giá (VND) + liên hệ + ưu đãi */}
          <div className="border rounded-lg p-3 space-y-3">
            <p className="font-semibold text-sm mb-1">Mức giá</p>

            {/* Hàng 1: Giá hiển thị + Liên hệ */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="flex-1">
                <label className="block text-xs text-slate-600 mb-1">
                  Giá hiển thị (VND)
                </label>
                <input
                  type="text"
                  id="priceDisplay"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  placeholder="VD: 700 triệu, 4.5 tỷ, 3.2 tỷ thương lượng..."
                  value={formData.priceDisplay}
                  onChange={handleChange}
                  disabled={formData.priceContact}
                />
                {!formData.priceContact && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Hệ thống sẽ cố gắng hiểu đơn vị (triệu / tỷ) và lưu thành số
                    VND để sắp xếp.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="priceContact"
                  checked={formData.priceContact}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <label
                  htmlFor="priceContact"
                  className="text-xs text-slate-700"
                >
                  Liên hệ để biết giá
                </label>
              </div>
            </div>

            {/* Hàng 2: Giá ưu đãi */}
            {formData.offer && !formData.priceContact && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Giá ưu đãi (VND)
                  </label>
                  <input
                    type="text"
                    id="discountPriceDisplay"
                    className="w-full border rounded-lg px-2 py-2 text-sm"
                    value={formData.discountPriceDisplay}
                    onChange={handleChange}
                    placeholder="VD: 650 triệu, 1.8 tỷ..."
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Chỉ dùng khi bật <strong>"Có ưu đãi"</strong> và không chọn{' '}
                    <strong>"Liên hệ để biết giá"</strong>. Hệ thống kiểm tra đảm
                    bảo giá ưu đãi &lt; giá thông thường.
                  </p>
                </div>

                <div className="flex flex-col justify-end text-[11px] text-slate-500">
                  {!formData.priceContact && formData.regularPrice > 0 && (
                    <span>
                      Giá gốc hệ thống hiểu:{' '}
                      <strong>
                        {Number(formData.regularPrice).toLocaleString('vi-VN')} đ
                      </strong>
                    </span>
                  )}
                  {formData.offer &&
                    !formData.priceContact &&
                    formData.discountPrice > 0 && (
                      <span className="mt-1">
                        Giá ưu đãi hệ thống hiểu:{' '}
                        <strong>
                          {Number(formData.discountPrice).toLocaleString(
                            'vi-VN'
                          )}{' '}
                          đ
                        </strong>
                      </span>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Thông tin liên hệ */}
          <div className="border rounded-lg p-3 space-y-3">
            <p className="font-semibold text-sm mb-1">Thông tin liên hệ</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Tên liên hệ
                </label>
                <input
                  type="text"
                  id="contactName"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.contactName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  id="contactPhone"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.contactEmail}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Zalo liên hệ
                </label>
                <input
                  type="text"
                  id="contactZalo"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={formData.contactZalo}
                  onChange={handleChange}
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Với tin VIP/Premium, thông tin liên hệ sẽ hiển thị ngay trên card
              ngoài trang tìm kiếm.
            </p>
          </div>
        </div>

        {/* Cột phải: ảnh */}
        <div className="flex flex-col gap-4 flex-1">
          <p className="font-semibold">Hình ảnh</p>
          <span className="text-sm text-gray-600">
            Ảnh đầu tiên là ảnh bìa. Mỗi tin được tải tối đa{' '}
            <strong>{MAX_IMAGES}</strong> ảnh.
          </span>

          <div className="flex gap-4">
            <input
              onChange={(e) => setFiles(e.target.files)}
              type="file"
              id="images"
              accept="image/*"
              multiple
              className="p-3 border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={handleImageSubmit}
              disabled={uploading}
              className="p-3 text-sm bg-slate-700 text-white rounded-lg hover:opacity-95 disabled:opacity-60"
            >
              {uploading ? 'Đang upload...' : 'Tải ảnh lên'}
            </button>
          </div>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {imageUrls.map((url, index) => (
                <div key={url + index} className="relative group">
                  <img
                    src={url}
                    alt={`listing-${index}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-[10px] transition">
                    <button
                      type="button"
                      onClick={() => handleMakeCover(index)}
                      className="px-2 py-1 bg-emerald-500 text-white rounded"
                    >
                      Đặt làm bìa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="px-2 py-1 bg-red-500 text-white rounded"
                    >
                      Xoá
                    </button>
                  </div>
                  {index === 0 && (
                    <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                      Bìa
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-red-700 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || imageUrls.length === 0}
            className="p-3 bg-slate-700 text-white rounded-lg uppercase disabled:opacity-80 hover:opacity-95 text-sm"
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        </div>
      </form>
    </main>
  );
}
