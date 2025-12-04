import React from "react";
import { Link } from "react-router-dom";
import {
  FaCamera,
  FaRulerCombined,
  FaMapMarkerAlt,
  FaDollarSign,
  FaCheckCircle,
  FaLightbulb,
  FaArrowRight
} from "react-icons/fa";

export default function Guide() {
  return (
    <div className="bg-white text-slate-800 font-sans">
      
      {/* === 1. HERO SECTION === */}
      <section className="relative h-[400px] md:h-[500px] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1600&auto=format&fit=crop"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
        </div>
        
        <div className="relative z-10 max-w-4xl animate-fadeInUp">
          <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
            Dành cho người bán & môi giới
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Hướng dẫn đăng tin <br className="hidden md:block" /> 
            <span className="text-emerald-400">hiệu quả & chuyên nghiệp</span>
          </h1>
          <p className="text-slate-200 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Chỉ với 4 bước đơn giản để tin đăng của bạn tiếp cận hàng ngàn khách hàng tiềm năng mỗi ngày.
          </p>
          
          <div className="mt-8">
            <Link
              to="/create-listing"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:-translate-y-1"
            >
              Bắt đầu ngay <FaArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* === 2. PROCESS STEPS (4 BƯỚC) === */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Quy trình đăng tin chuẩn</h2>
          <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
            Tuân thủ các bước sau để đảm bảo tin đăng của bạn được duyệt nhanh chóng và thu hút nhiều lượt xem nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <StepCard 
            step="01"
            icon={<FaCamera />}
            title="Hình ảnh chất lượng"
            desc="Chụp ảnh sáng, rõ nét các phòng: Khách, Ngủ, Bếp, WC. Nên dùng ảnh ngang (tỷ lệ 16:9)."
            img="https://www.livehome3d.com/assets/img/articles/design-house/how-to-design-a-house.jpg"
          />
          {/* Step 2 */}
          <StepCard 
            step="02"
            icon={<FaRulerCombined />}
            title="Thông tin chi tiết"
            desc="Điền đầy đủ: Diện tích, Số phòng, Hướng nhà, Pháp lý. Mô tả càng kỹ càng tốt."
            img="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&auto=format&fit=crop"
          />
          {/* Step 3 */}
          <StepCard 
            step="03"
            icon={<FaDollarSign />}
            title="Định giá hợp lý"
            desc="Tham khảo giá thị trường hoặc dùng công cụ AI của chúng tôi để đưa ra mức giá cạnh tranh."
            img="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600&auto=format&fit=crop"
          />
          {/* Step 4 */}
          <StepCard 
            step="04"
            icon={<FaMapMarkerAlt />}
            title="Vị trí chính xác"
            desc="Ghim đúng vị trí trên bản đồ để khách hàng dễ hình dung khu vực và tiện ích xung quanh."
            img="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=600&auto=format&fit=crop"
          />
        </div>
      </section>

      {/* === 3. PRO TIPS SECTION === */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 flex flex-col lg:flex-row gap-12 items-center">
            
            {/* Left Content */}
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                <FaLightbulb /> Mẹo chuyên gia
              </div>
              <h2 className="text-3xl font-bold text-slate-900">
                Làm sao để tin đăng nổi bật?
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Hàng ngàn tin đăng mới mỗi ngày. Để không bị trôi tin, hãy áp dụng ngay những bí quyết nhỏ này:
              </p>
              
              <ul className="space-y-4 mt-4">
                {[
                  "Tiêu đề chứa từ khóa 'hot' (Gần chợ, Hẻm xe hơi, View sông...)",
                  "Đầu tư ảnh bìa đẹp nhất để tăng tỷ lệ click (CTR).",
                  "Phản hồi tin nhắn/cuộc gọi trong vòng 30 phút.",
                  "Sử dụng gói tin VIP/Premium để luôn nằm ở trang đầu."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" />
                    <span className="text-slate-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Link
                  to="/pricing"
                  className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  Xem bảng giá dịch vụ <FaArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="flex-1 w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop" 
                  alt="Tips" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <p className="text-white font-medium">"Hình ảnh đẹp giúp tăng 40% tỷ lệ liên hệ."</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* === 4. CALL TO ACTION (CTA) === */}
      <section className="py-24 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Sẵn sàng chốt giao dịch?
          </h2>
          <p className="text-slate-500 text-lg">
            Đừng để tài sản của bạn nằm im. Đăng tin ngay hôm nay để kết nối với người mua phù hợp nhất.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              to="/create-listing"
              className="px-8 py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-1"
            >
              Đăng tin ngay
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
            >
              Liên hệ hỗ trợ
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

// --- Helper Component: Step Card ---
function StepCard({ step, icon, title, desc, img }) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Image Header */}
      <div className="h-40 w-full overflow-hidden relative">
        <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold shadow-sm text-slate-800">
          BƯỚC {step}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="w-12 h-12 rounded-xl bg-slate-50 text-emerald-600 flex items-center justify-center text-xl mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}