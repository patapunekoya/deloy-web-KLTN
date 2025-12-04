import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode, Autoplay } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css/bundle';
import { FaSearch, FaHome, FaCity, FaChartLine, FaArrowRight, FaRegCheckCircle } from 'react-icons/fa';
import ListingItem from '../components/ListingItem';

SwiperCore.use([Navigation, FreeMode, Autoplay]);

export default function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Logic fetch dữ liệu giữ nguyên
  useEffect(() => {
    const fetchOfferListings = async () => {
      try {
        const res = await fetch('/api/listing/get?offer=true&limit=10');
        const data = await res.json();
        setOfferListings(Array.isArray(data) ? data : []);
        await fetchRentListings();
      } catch (error) {
        setErr('Không tải được dữ liệu ưu đãi.');
      }
    };

    const fetchRentListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=rent&limit=10');
        const data = await res.json();
        setRentListings(Array.isArray(data) ? data : []);
        await fetchSaleListings();
      } catch (error) {
        setErr((prev) => prev || 'Không tải được dữ liệu cho thuê.');
      }
    };

    const fetchSaleListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=sale&limit=10');
        const data = await res.json();
        setSaleListings(Array.isArray(data) ? data : []);
      } catch (error) {
        setErr((prev) => prev || 'Không tải được dữ liệu mua bán.');
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    setErr('');
    fetchOfferListings();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    urlParams.set('searchTerm', searchTerm);
    navigate(`/search?${urlParams.toString()}`);
  };

  return (
    <div className="bg-white text-slate-800 font-sans">
      {/* ================= 1. HERO SECTION ================= */}
      <div className="relative h-[500px] md:h-[600px] flex flex-col items-center justify-center text-center px-4">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="https://media.vneconomy.vn/images/upload/2025/05/20/94-98.png?w=900" 
            alt="Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl w-full space-y-6 animate-fadeInUp">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight shadow-sm">
            Khởi đầu tổ ấm <br className="hidden md:block" /> 
            với <span className="text-emerald-400">PPHouse</span>
          </h1>
          <p className="text-slate-100 text-base md:text-lg max-w-2xl mx-auto font-light">
            Hệ thống dữ liệu bất động sản minh bạch, tích hợp AI định giá, giúp bạn tìm kiếm ngôi nhà mơ ước nhanh chóng.
          </p>

          {/* Main Search Bar */}
          <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto bg-white p-2 rounded-full shadow-2xl flex items-center">
            <div className="pl-4 text-slate-400">
              <FaSearch size={20} />
            </div>
            <input
              type="text"
              placeholder="Nhập địa điểm, dự án, hoặc tên đường..."
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-700 text-base placeholder:text-slate-400 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 shadow-md"
            >
              Tìm kiếm
            </button>
          </form>

          {/* Quick Tags */}
          {/* <div className="flex flex-wrap justify-center gap-3 mt-4 text-sm text-white/90">
            <span>Gợi ý:</span>
            <Link to="/search?type=rent" className="hover:text-emerald-300 hover:underline">Căn hộ cho thuê</Link>
            <span>•</span>
            <Link to="/search?type=sale" className="hover:text-emerald-300 hover:underline">Nhà phố bán</Link>
            <span>•</span>
            <Link to="/dudoan" className="hover:text-emerald-300 hover:underline">Định giá AI</Link>
          </div> */}
        </div>
      </div>

      {/* ================= 2. CATEGORY SHORTCUTS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<FaHome size={32} />} 
            title="Mua nhà ở" 
            desc="Tìm ngôi nhà hoàn hảo với hàng ngàn tin đăng xác thực."
            link="/search?type=sale"
            color="bg-blue-600"
          />
          <FeatureCard 
            icon={<FaCity size={32} />} 
            title="Thuê căn hộ" 
            desc="Đa dạng lựa chọn căn hộ, chung cư với giá tốt nhất."
            link="/search?type=rent"
            color="bg-emerald-600"
          />
          <FeatureCard 
            icon={<FaChartLine size={32} />} 
            title="Định giá AI" 
            desc="Công nghệ AI dự đoán giá nhà đất chính xác tới 95%."
            link="/dudoan"
            color="bg-purple-600"
          />
        </div>
      </div>

      {/* ================= 3. LISTING SECTIONS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        
        {/* Error Display */}
        {err && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-center">
            {err}
          </div>
        )}

        {/* --- Mục: Tin Ưu đãi --- */}
        <Section 
          title="Bất động sản Ưu đãi" 
          subtitle="Những tin đăng có giá tốt nhất thị trường hiện nay"
          link="/search?offer=true"
          loading={loading}
          data={offerListings}
        />

        {/* --- Mục: Tin Cho thuê (Có background khác biệt) --- */}
        <div className="relative">
           {/* Decorative background for this section */}
           <div className="absolute -inset-x-4 -inset-y-8 bg-slate-50 rounded-3xl -z-10" />
           <Section 
            title="Thuê nhà & Căn hộ mới nhất" 
            subtitle="Cập nhật liên tục các căn hộ dịch vụ, nhà nguyên căn"
            link="/search?type=rent"
            loading={loading}
            data={rentListings}
          />
        </div>

        {/* --- Mục: Tin Mua bán --- */}
        <Section 
          title="Mua bán Nhà đất" 
          subtitle="Cơ hội đầu tư và an cư lạc nghiệp"
          link="/search?type=sale"
          loading={loading}
          data={saleListings}
        />
        
      </div>

      {/* ================= 4. WHY CHOOSE US ================= */}
      <section className="bg-emerald-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Tại sao chọn PPHouse?</h2>
            <div className="space-y-4">
              <ReasonItem text="Dữ liệu minh bạch, chính chủ, được kiểm duyệt kỹ càng." />
              <ReasonItem text="Công cụ định giá AI tiên tiến hỗ trợ ra quyết định đầu tư." />
              <ReasonItem text="Kết nối trực tiếp người mua và người bán, không qua trung gian." />
              <ReasonItem text="Hỗ trợ tư vấn pháp lý và thủ tục nhà đất miễn phí." />
            </div>
            <Link 
              to="/about"
              className="inline-block mt-4 bg-white text-emerald-900 px-6 py-3 rounded-lg font-bold hover:bg-emerald-50 transition"
            >
              Tìm hiểu thêm về chúng tôi
            </Link>
          </div>
          <div className="flex-1">
            <img 
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop" 
              alt="Building" 
              className="rounded-2xl shadow-2xl border-4 border-emerald-800/50"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

/* --- Sub-components --- */

// Card tính năng nổi bật (shortcut)
function FeatureCard({ icon, title, desc, link, color }) {
  return (
    <Link to={link} className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-100 flex flex-col items-start hover:-translate-y-1">
      <div className={`${color} text-white p-4 rounded-xl mb-4 shadow-md group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">{desc}</p>
      <span className="text-emerald-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
        Khám phá ngay <FaArrowRight size={12} />
      </span>
    </Link>
  );
}

// Mục lý do chọn
function ReasonItem({ text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 text-emerald-400">
        <FaRegCheckCircle size={20} />
      </div>
      <p className="text-slate-100 leading-relaxed">{text}</p>
    </div>
  );
}

// Section hiển thị danh sách tin (Slider)
function Section({ title, subtitle, link, loading, data }) {
  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-slate-500 mt-1 text-sm md:text-base">{subtitle}</p>}
        </div>
        <Link 
          to={link} 
          className="hidden md:flex items-center gap-1 text-emerald-700 font-semibold hover:text-emerald-800 hover:underline transition"
        >
          Xem tất cả <FaArrowRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-[340px] bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        data && data.length > 0 ? (
          <Swiper
            slidesPerView={1}
            spaceBetween={20}
            breakpoints={{
              640: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
            }}
            navigation
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            className="pb-8 !px-1"
          >
            {data.map((listing) => (
              <SwiperSlide key={listing._id} className="h-auto">
                 <ListingItem listing={listing} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 italic">
            Chưa có tin đăng nào trong mục này.
          </div>
        )
      )}

      {/* Mobile View All Link */}
      <div className="mt-4 md:hidden text-center">
         <Link to={link} className="inline-flex items-center justify-center w-full py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50">
            Xem tất cả
         </Link>
      </div>
    </section>
  );
}