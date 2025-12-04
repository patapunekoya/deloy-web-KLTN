import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="bg-white text-slate-800">
      {/* Hero */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80"
          alt="City skyline"
          className="w-full h-[400px] object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center">
            About Us
          </h1>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Who We Are</h2>
        <p className="text-lg text-slate-600 leading-relaxed">
          Chúng tôi là nền tảng bất động sản hiện đại, giúp khách hàng dễ dàng
          kết nối với những ngôi nhà mơ ước. Với đội ngũ chuyên nghiệp và công
          nghệ tiên tiến, chúng tôi cam kết mang lại trải nghiệm minh bạch,
          tiện lợi và nhanh chóng cho người mua và người bán.
        </p>
      </section>

      {/* Mission & Values */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 px-6">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Sứ mệnh của chúng tôi</h3>
            <p className="text-slate-600 leading-relaxed">
              Nâng cao chất lượng giao dịch bất động sản bằng công nghệ, giúp
              khách hàng tiết kiệm thời gian và chi phí. Chúng tôi hướng tới một
              thị trường minh bạch, nơi mọi người đều có thể dễ dàng tiếp cận
              thông tin và ra quyết định chính xác.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-4">Giá trị cốt lõi</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li>Minh bạch trong thông tin</li>
              <li>Đặt khách hàng làm trung tâm</li>
              <li>Ứng dụng công nghệ hiện đại</li>
              <li>Chuyên nghiệp và tận tâm</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Image Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h3 className="text-2xl font-bold text-center mb-10">Hành trình của chúng tôi</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <img
            src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
            alt="Team working"
            className="rounded-lg shadow-md object-cover h-64 w-full"
          />
          <img
            src="https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=800&q=80"
            alt="Office"
            className="rounded-lg shadow-md object-cover h-64 w-full"
          />
          <img
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
            alt="Happy clients"
            className="rounded-lg shadow-md object-cover h-64 w-full"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-16 text-center">
        <h3 className="text-2xl font-bold mb-4">
          Ready to find your dream home?
        </h3>
        <p className="mb-6 text-slate-300">
          Khám phá ngay hàng ngàn căn nhà được cập nhật mỗi ngày.
        </p>
        <Link
          to="/search"
          className="inline-block bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Bắt đầu tìm kiếm
        </Link>
      </section>
    </div>
  );
}
