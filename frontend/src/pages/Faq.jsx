import React from "react";
import { Link } from "react-router-dom";
import { 
  FaChevronDown, 
  FaEdit, 
  FaUserShield, 
  FaQuestionCircle, 
  FaHeadset, 
  FaEnvelope 
} from "react-icons/fa";

export default function Faq() {
  const faqs = [
    {
      category: "Đăng tin & Quản lý tin",
      icon: <FaEdit className="text-emerald-600" />,
      questions: [
        {
          q: "Làm thế nào để đăng tin bán hoặc cho thuê nhà?",
          a: "Bạn cần đăng nhập tài khoản, vào mục 'Đăng tin' trên thanh menu. Điền đầy đủ thông tin bắt buộc (hình ảnh, mô tả, giá, địa chỉ) và nhấn 'Tạo bài đăng'. Tin sẽ được duyệt tự động hoặc thủ công tùy theo quy định trước khi hiển thị.",
        },
        {
          q: "Tôi có thể chỉnh sửa hoặc gỡ tin đã đăng không?",
          a: "Có. Bạn truy cập vào trang 'Hồ sơ cá nhân' (Profile). Tại danh sách tin đăng, bạn sẽ thấy các nút 'Sửa' hoặc 'Xóa' tương ứng với từng bài viết.",
        },
        {
          q: "Tin đăng tồn tại trong bao lâu?",
          a: "Thời gian hiển thị phụ thuộc vào gói tin bạn chọn (Tin thường, VIP, Premium). Khi hết hạn, bạn có thể gia hạn tin trong phần quản lý cá nhân.",
        },
      ],
    },
    {
      category: "Tài khoản & Bảo mật",
      icon: <FaUserShield className="text-emerald-600" />,
      questions: [
        {
          q: "Làm thế nào để đổi mật khẩu?",
          a: "Tại trang 'Hồ sơ cá nhân', bạn điền mật khẩu mới vào ô Mật khẩu và nhấn Cập nhật. Lưu ý bảo mật tài khoản và không chia sẻ mật khẩu cho người khác.",
        },
        {
          q: "Thông tin cá nhân của tôi có được bảo mật không?",
          a: "Chúng tôi cam kết bảo mật thông tin người dùng theo chính sách bảo mật. Số điện thoại và email chỉ được hiển thị cho người mua khi bạn cho phép (đối với tin Premium) hoặc khi bạn chủ động liên hệ.",
        },
      ],
    },
    {
      category: "Công cụ & Tiện ích",
      icon: <FaQuestionCircle className="text-emerald-600" />,
      questions: [
        {
          q: "Làm sao để dự đoán giá nhà trước khi mua?",
          a: "Bạn hãy truy cập trang 'Định giá AI' trên thanh menu. Nhập các thông số như: Quận/Huyện, Diện tích, Số phòng ngủ... Hệ thống AI sẽ phân tích dữ liệu thị trường và đưa ra mức giá gợi ý.",
        },
        {
          q: "Tôi nạp tiền mua gói tin như thế nào?",
          a: "Truy cập trang 'Bảng giá', chọn gói tin phù hợp và tiến hành thanh toán qua cổng PayOS (hỗ trợ QR Code ngân hàng). Gói tin sẽ được cộng ngay lập tức sau khi thanh toán thành công.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-700 font-sans">
      
      {/* === 1. HERO SECTION === */}
      <section className="bg-emerald-50/50 py-16 md:py-20 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Câu hỏi thường gặp
          </h1>
          <p className="text-slate-500 text-lg">
            Tổng hợp những thắc mắc phổ biến nhất giúp bạn sử dụng PPHouse hiệu quả.
          </p>
        </div>
      </section>

      {/* === 2. FAQ CONTENT === */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-10">
          {faqs.map((section, idx) => (
            <div key={idx} className="scroll-mt-24" id={`cat-${idx}`}>
              {/* Category Title */}
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  {section.icon}
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  {section.category}
                </h2>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {section.questions.map((item, i) => (
                  <FaqItem key={i} question={item.q} answer={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === 3. CONTACT SUPPORT === */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            Vẫn chưa tìm thấy câu trả lời?
          </h3>
          <p className="text-slate-500 mb-8">
            Đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="tel:0123456789" 
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-500 hover:text-emerald-600 transition-all font-medium text-slate-700"
            >
              <FaHeadset />
              Gọi Hotline: 0123 456 789
            </a>
            <a 
              href="mailto:support@pphouse.vn" 
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all font-medium"
            >
              <FaEnvelope />
              Gửi Email Hỗ Trợ
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}

// Component con để xử lý hiệu ứng đóng mở (Accordion)
function FaqItem({ question, answer }) {
  return (
    <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-5 text-slate-900">
        <h3 className="font-semibold text-base md:text-lg">{question}</h3>
        <span className="shrink-0 rounded-full bg-slate-50 p-1.5 text-slate-500 sm:p-3 group-open:bg-emerald-50 group-open:text-emerald-600 transition-colors">
          <FaChevronDown className="h-3 w-3 md:h-4 md:w-4 transition duration-300 group-open:-rotate-180" />
        </span>
      </summary>
      <div className="px-5 pb-5 pt-0 leading-relaxed text-slate-600 text-sm md:text-base animate-fadeIn">
        <p>{answer}</p>
      </div>
    </details>
  );
}