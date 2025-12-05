import { useMemo, useState } from "react";
import { DollarSign, MapPin, Bed, Bath, Home } from "lucide-react";
import regions from "../data/dvhcvn.json";

const PREDICT_URL = "/api/price/predict";

// Chuẩn hoá tiếng Việt để search không dấu
const normalizeText = (str) =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Build tree City -> District -> Ward từ dvhcvn.json
// dvhcvn.json: dùng level1_id / level2_id / level3_id như README repo
const RAW_REGIONS = Array.isArray(regions)
  ? regions
  : regions.data || regions.items || [];

// Mỗi city: { code, name, districts: [{ code, name, wards: [...] }] }
const CITIES = RAW_REGIONS.map((city) => ({
  code: Number(city.level1_id),
  name: city.name,
  districts: (city.level2s || []).map((dist) => ({
    code: Number(dist.level2_id),
    name: dist.name,
    wards: (dist.level3s || []).map((ward) => ({
      code: Number(ward.level3_id),
      name: ward.name,
    })),
  })),
}));

// House / Balcony direction mapping
const DIRECTION_OPTIONS = [
  { label: "Unknown", value: 1 },
  { label: "Đông - Bắc", value: 2 },
  { label: "Tây - Nam", value: 3 },
  { label: "Đông - Nam", value: 4 },
  { label: "Tây - Bắc", value: 5 },
  { label: "Nam", value: 6 },
  { label: "Đông", value: 7 },
  { label: "Bắc", value: 8 },
  { label: "Tây", value: 9 },
];

// Legal status mapping
const LEGAL_OPTIONS = [
  { label: "Khác / Không rõ", value: 1 },
  { label: "Đã có sổ / GCN", value: 2 },
  { label: "Hợp đồng mua bán", value: 3 },
];

// Furniture state mapping
const FURNITURE_OPTIONS = [
  { label: "Không nội thất", value: 1 },
  { label: "Đầy đủ nội thất", value: 2 },
  { label: "Cơ bản", value: 3 },
];

// State mặc định (gán 1 địa chỉ sample, code ông tự chỉnh lại nếu muốn)
const initialFormState = {
  city_code: 79, // HCM (ví dụ, nhớ check lại mapping)
  district_code: 764, // Gò Vấp
  ward_code: 26899, // P11
  area: 55,
  floors: 3,
  bedrooms: 3,
  bathrooms: 3,
  frontage: 4.5,
  access_road: 6.0,
  house_direction: 2,
  balcony_direction: 2,
  legal_status: 2,
  furniture_state: 2,
};

export default function DuDoanGiaNha() {
  const [form, setForm] = useState(initialFormState);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Text user gõ (hiển thị chữ), code thì giữ trong form
  const [cityInput, setCityInput] = useState("Hồ Chí Minh");
  const [districtInput, setDistrictInput] = useState("Gò Vấp");
  const [wardInput, setWardInput] = useState("Phường 11");

  const onChange = (key, val) => {
    const numericKeys = [
      "city_code",
      "district_code",
      "ward_code",
      "area",
      "floors",
      "bedrooms",
      "bathrooms",
      "frontage",
      "access_road",
      "house_direction",
      "balcony_direction",
      "legal_status",
      "furniture_state",
    ];
    const isNumeric = numericKeys.includes(key);
    const n = isNumeric ? Number(val) : val;

    setForm((prev) => ({
      ...prev,
      [key]: isNumeric && isNaN(n) ? 0 : n,
    }));
  };

  // Lấy city/district/ward đang chọn từ code
  const selectedCity = useMemo(
    () => CITIES.find((c) => c.code === form.city_code) || null,
    [form.city_code]
  );

  const selectedDistrict = useMemo(
    () =>
      selectedCity?.districts.find(
        (d) => d.code === form.district_code
      ) || null,
    [selectedCity, form.district_code]
  );

  const selectedWard = useMemo(
    () =>
      selectedDistrict?.wards.find(
        (w) => w.code === form.ward_code
      ) || null,
    [selectedDistrict, form.ward_code]
  );

  const handleSelectCity = (city) => {
    setCityInput(city.name);
    setDistrictInput("");
    setWardInput("");

    onChange("city_code", city.code);
    onChange("district_code", 0);
    onChange("ward_code", 0);
  };

  const handleSelectDistrict = (dist) => {
    setDistrictInput(dist.name);
    setWardInput("");

    onChange("district_code", dist.code);
    onChange("ward_code", 0);
  };

  const handleSelectWard = (ward) => {
    setWardInput(ward.name);
    onChange("ward_code", ward.code);
  };

  const submitDisabled = useMemo(() => {
    if (form.area <= 0) return true;
    if (!form.city_code || !form.district_code || !form.ward_code) return true;
    return false;
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setResult(null);
    setLoading(true);

    const payload = {
      features: {
        city_code: form.city_code,
        district_code: form.district_code,
        ward_code: form.ward_code,
        area: form.area,
        frontage: form.frontage,
        access_road: form.access_road,
        house_direction: form.house_direction,
        balcony_direction: form.balcony_direction,
        floors: form.floors,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        legal_status: form.legal_status,
        furniture_state: form.furniture_state,
      },
    };

    try {
      const res = await fetch(PREDICT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let detail = "";
        try {
          const body = await res.json();
          detail = body?.detail || "";
        } catch (_) {}
        throw new Error(`HTTP ${res.status} ${detail}`);
      }

      const data = await res.json();
      const price = data?.predicted_price;

      if (price == null) throw new Error("Không nhận được giá dự đoán từ server");
      setResult(Number(price));
    } catch (error) {
      setErr(error?.message || "Lỗi dự đoán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white rounded-xl shadow-md">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">
            Dự đoán Giá Nhà Việt Nam
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Mô hình Random Forest huấn luyện từ dữ liệu thực tế với 13 đặc trưng
            (City_Code, District_Code, Ward_Code, Area, ...).
          </p>
        </div>
        <div className="flex gap-2 mt-3 md:mt-0">
          <Badge color="bg-green-100 text-green-800">MAE: ~0.90</Badge>
          <Badge color="bg-indigo-100 text-indigo-800">
            Random Forest Regressor
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM */}
        <form
          onSubmit={onSubmit}
          className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="p-6">
            <SectionTitle>I. Vị trí (Tỉnh / Quận / Phường)</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CITY */}
              <SearchSelect
                label="Tỉnh / Thành phố"
                value={cityInput}
                onChange={setCityInput}
                options={CITIES}
                onSelect={handleSelectCity}
                placeholder="Ví dụ: Hồ Chí Minh"
                helper={
                  form.city_code
                    ? `City_Code: ${form.city_code}`
                    : "Chưa chọn tỉnh / thành"
                }
              />

              {/* DISTRICT */}
              <SearchSelect
                label="Quận / Huyện"
                value={districtInput}
                onChange={setDistrictInput}
                options={selectedCity ? selectedCity.districts : []}
                onSelect={handleSelectDistrict}
                placeholder={
                  selectedCity ? "Ví dụ: Gò Vấp" : "Chọn tỉnh / thành trước"
                }
                disabled={!selectedCity}
                helper={
                  form.district_code
                    ? `District_Code: ${form.district_code}`
                    : "Chưa chọn quận / huyện"
                }
              />

              {/* WARD */}
              <SearchSelect
                label="Phường / Xã"
                value={wardInput}
                onChange={setWardInput}
                options={selectedDistrict ? selectedDistrict.wards : []}
                onSelect={handleSelectWard}
                placeholder={
                  selectedDistrict ? "Ví dụ: Phường 11" : "Chọn quận / huyện trước"
                }
                disabled={!selectedDistrict}
                helper={
                  form.ward_code
                    ? `Ward_Code: ${form.ward_code}`
                    : "Chưa chọn phường / xã"
                }
              />
            </div>

            <SectionTitle>II. Thông số cơ bản</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Diện tích (m²)"
                type="number"
                name="area"
                form={form}
                onChange={onChange}
                icon={Home}
                placeholder="vd: 55"
              >
                <HelpText>Tổng diện tích nhà/đất.</HelpText>
              </InputField>

              <InputField
                label="Số tầng"
                type="number"
                name="floors"
                form={form}
                onChange={onChange}
                icon={Home}
                placeholder="vd: 3"
              />

              <InputField
                label="Số phòng ngủ"
                type="number"
                name="bedrooms"
                form={form}
                onChange={onChange}
                icon={Bed}
                placeholder="vd: 3"
              />

              <InputField
                label="Số phòng tắm/WC"
                type="number"
                name="bathrooms"
                form={form}
                onChange={onChange}
                icon={Bath}
                placeholder="vd: 3"
              />

              <InputField
                label="Mặt tiền (m)"
                type="number"
                name="frontage"
                form={form}
                onChange={onChange}
                icon={MapPin}
                placeholder="vd: 4.5"
              />

              <InputField
                label="Đường vào (m)"
                type="number"
                name="access_road"
                form={form}
                onChange={onChange}
                icon={MapPin}
                placeholder="vd: 6.0"
              />
            </div>

            <SectionTitle>III. Hướng & Pháp lý</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Hướng nhà (mã số)"
                name="house_direction"
                form={form}
                onChange={onChange}
                options={DIRECTION_OPTIONS}
              />

              <SelectField
                label="Hướng ban công (mã số)"
                name="balcony_direction"
                form={form}
                onChange={onChange}
                options={DIRECTION_OPTIONS}
              />

              <SelectField
                label="Tình trạng pháp lý (mã số)"
                name="legal_status"
                form={form}
                onChange={onChange}
                options={LEGAL_OPTIONS}
              />

              <SelectField
                label="Tình trạng nội thất (mã số)"
                name="furniture_state"
                form={form}
                onChange={onChange}
                options={FURNITURE_OPTIONS}
              />
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 flex items-center justify-between bg-gray-50">
            <div className="text-xs text-slate-500">
             
            </div>
            <button
              type="submit"
              disabled={submitDisabled || loading}
              className={`px-6 py-3 rounded-xl font-semibold text-white transition duration-200 shadow-md ${
                submitDisabled || loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "Đang xử lý..." : "Dự đoán Giá Nhà"}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-6">
          <ResultCard result={result} err={err} loading={loading} />
          <GuidanceCard />
        </div>
      </div>
    </div>
  );
}

/* ====== COMPONENT PHỤ (JSX, KHÔNG TYPE) ====== */

const SectionTitle = ({ children }) => (
  <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mb-4">
    {children}
  </h3>
);

const HelpText = ({ children }) => (
  <p className="text-xs text-slate-500 mt-1">{children}</p>
);

const Badge = ({ children, color = "bg-indigo-100 text-indigo-800" }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${color}`}
  >
    {children}
  </span>
);

const InputField = ({
  label,
  type,
  name,
  form,
  onChange,
  icon: Icon,
  children,
  ...props
}) => (
  <div className="flex flex-col">
    <label
      htmlFor={name}
      className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-1"
    >
      {Icon && <Icon className="w-4 h-4 text-indigo-500" />} {label}
    </label>
    <input
      id={name}
      type={type}
      name={name}
      value={form[name] ?? ""}
      onChange={(e) => onChange(name, e.target.value)}
      className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
      {...props}
    />
    {children}
  </div>
);

const SelectField = ({ label, name, form, onChange, options }) => (
  <div className="flex flex-col">
    <label
      htmlFor={name}
      className="text-sm font-medium text-slate-700 mb-1"
    >
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={form[name]}
      onChange={(e) => onChange(name, e.target.value)}
      className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// Autocomplete input cho City / District / Ward
const SearchSelect = ({
  label,
  value,
  onChange,
  options,
  onSelect,
  placeholder,
  disabled,
  helper,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const filtered = useMemo(() => {
    if (!options || options.length === 0) return [];
    const q = value.trim();
    if (!q) return options.slice(0, 20); // chưa gõ: hiện 20 dòng đầu

    const normQ = normalizeText(q);
    return options
      .filter((opt) => normalizeText(opt.name).includes(normQ))
      .slice(0, 20);
  }, [options, value]);

  const handleSelect = (opt) => {
    onSelect(opt);
  };

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder={placeholder}
          className={`border p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
            disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
          }`}
        />
        {isFocused && !disabled && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border bg-white shadow-lg">
            {filtered.map((opt) => (
              <div
                key={opt.code}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt);
                }}
                className="px-3 py-1.5 text-sm hover:bg-indigo-50 cursor-pointer flex justify-between"
              >
                <span>{opt.name}</span>
                <span className="text-xs text-slate-400">{opt.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {helper && (
        <p className="text-xs text-slate-500 mt-1">{helper}</p>
      )}
    </div>
  );
};

const ResultCard = ({ result, err, loading }) => {
  const formatCurrency = (amount) => {
    if (amount === null) return "—";
    const totalVND = amount * 1_000_000_000;
    return totalVND.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl h-fit">
      <SectionTitle>Kết quả Dự đoán</SectionTitle>
      {loading ? (
        <div className="flex items-center justify-center h-24">
          <svg
            className="animate-spin h-5 w-5 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-3 text-indigo-600">Đang tính toán...</span>
        </div>
      ) : result !== null ? (
        <div className="mt-3">
          <div className="text-xl font-bold text-green-600 mt-2">
            {formatCurrency(result)}
          </div>
          <p className="text-sm text-slate-500 mt-2 border-t pt-2">
            (* Đơn vị: <strong>Tỷ VNĐ</strong> theo unit hiện tại của mô hình.)
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500 h-24">
          Nhập thông số và bấm <strong>Dự đoán Giá Nhà</strong>.
        </p>
      )}

      {err && (
        <div className="mt-3 rounded-lg border border-red-300 bg-red-100 p-4 text-sm text-red-800">
          <div className="font-bold">Lỗi:</div>
          {err}
          <HelpText>Kiểm tra terminal FastAPI hoặc tab Network.</HelpText>
        </div>
      )}
    </div>
  );
};

const GuidanceCard = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
    <SectionTitle>Giới thiệu mô hình</SectionTitle>
    <div className="mt-3 space-y-3 text-sm text-slate-700">
      <p className="text-slate-600">
        Mô hình dự đoán giá nhà được huấn luyện trên bộ dữ liệu{" "}
        <span className="font-semibold">Vietnam Housing Dataset 2024</span>,
        gồm thông tin chi tiết về nhà đất thực tế tại Việt Nam (diện tích, số tầng,
        phòng ngủ, mặt tiền, đường vào, vị trí, pháp lý, nội thất...).
      </p>
      <p className="text-slate-600">
        Thuật toán sử dụng là{" "}
        <span className="font-semibold">Random Forest Regressor</span>. 
        Kết quả hiển thị trên trang là giá ước lượng theo đơn vị{" "}
        <span className="font-semibold">Tỷ VNĐ</span>, dùng để tham khảo,
        không thay thế cho định giá thực tế ngoài thị trường.
      </p>
      <p className="text-slate-700 font-semibold mt-2">
        Lưu ý: Giá hiển thị chỉ là <span className="underline">giá tham khảo từ mô hình</span>,
        <span className="ml-1">không thay thế cho thẩm định chính thức.</span>
      </p>
    </div>
  </div>
);


