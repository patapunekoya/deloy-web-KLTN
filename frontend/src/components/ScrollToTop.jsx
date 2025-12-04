// src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Mỗi lần đổi đường dẫn (pathname hoặc query) thì kéo lên đầu trang
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // hoặc 'smooth' nếu muốn cuộn mượt
    });
  }, [pathname, search]);

  return null;
}
