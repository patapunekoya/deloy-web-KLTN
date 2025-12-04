import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signOutStart,
  signOutSuccess,
  signOutFailure,
} from '../redux/userSlice';
import { Link, useNavigate } from 'react-router-dom';
import { uploadAvatarFromUrl, uploadToCloudinary } from '../utils/cloudinary';
import { toast } from 'react-hot-toast';
import { 
  FaUserEdit, FaListAlt, FaSignOutAlt, FaTrash, FaCamera, 
  FaGem, FaCrown, FaHistory, FaReceipt 
} from 'react-icons/fa';

// --- HELPERS FORMAT GIÁ ---
function formatPriceVnd(value) {
  if (value === null || value === undefined || value === '') return 'Liên hệ';
  if (typeof value === 'number') {
    return `${value.toLocaleString('vi-VN')} đ`;
  }
  return value;
}

function formatShortPriceVn(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '';
  }
  // >= 1 tỷ
  if (value >= 1_000_000_000) {
    const billions = Math.round((value / 1_000_000_000) * 10) / 10;
    const text = Number.isInteger(billions) ? billions.toString() : billions.toString();
    return `${text} tỷ`;
  }
  // >= 1 triệu
  if (value >= 1_000_000) {
    const millions = Math.round((value / 1_000_000) * 10) / 10;
    const text = Number.isInteger(millions) ? millions.toString() : millions.toString();
    return `${text} triệu`;
  }
  return `${value.toLocaleString('vi-VN')} đ`;
}
// --------------------------

export default function Profile() {
  const { currentUser, loading } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const me = currentUser?.rest ?? currentUser ?? null;

  const vipCredits = me?.vipCredits ?? 0;
  const premiumCredits = me?.premiumCredits ?? 0;

  const [activeTab, setActiveTab] = useState('info'); 

  const [formData, setFormData] = useState({
    username: me?.username || '',
    email: me?.email || '',
    phone: me?.phone || '',
    password: '',
  });

  const [avatarUrl, setAvatarUrl] = useState(me?.avatar || '');
  const [uploading, setUploading] = useState(false);
  
  // Listings state
  const [userListings, setUserListings] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingListings, setLoadingListings] = useState(false);

  // History Order state
  const [orders, setOrders] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    async function syncGoogleAvatar() {
      const avatar = me?.avatar;
      if (avatar && avatar.includes('googleusercontent.com')) {
        try {
          const url = await uploadAvatarFromUrl(avatar);
          await fetch(`/api/user/update/${me?._id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ avatar: url }),
          });
          setAvatarUrl(url);
        } catch (err) {
          console.error('Upload avatar failed:', err);
        }
      }
    }
    if (me) syncGoogleAvatar();
  }, [me?._id]);

  useEffect(() => {
    if (activeTab === 'listings' && !userListings) {
      handleShowListings();
    }
    if (activeTab === 'history' && !orders) {
      handleShowOrders();
    }
  }, [activeTab]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((p) => ({ ...p, [id]: value }));
  };

  const handlePickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadToCloudinary(file);
      setAvatarUrl(url);
      toast.success('Đã tải ảnh lên Cloudinary');
    } catch (err) {
      toast.error(err.message || 'Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const body = {
        username: formData.username,
        email: formData.email,
      };
      if (formData.phone !== undefined) body.phone = formData.phone;
      if (formData.password?.trim()) body.password = formData.password.trim();
      if (avatarUrl) body.avatar = avatarUrl;

      const res = await fetch(`/api/user/update/${me?._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        dispatch(updateUserFailure(data?.message));
        toast.error(data?.message);
        return;
      }
      dispatch(updateUserSuccess(data));
      toast.success('Cập nhật thành công');
    } catch (err) {
      dispatch(updateUserFailure(err.message));
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Xoá tài khoản? Hành động không thể hoàn tác.')) return;
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${me?._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        dispatch(deleteUserFailure('Xoá thất bại'));
        return;
      }
      dispatch(deleteUserSuccess());
      toast.success('Đã xoá tài khoản');
      navigate('/signup');
    } catch (err) {
      dispatch(deleteUserFailure(err.message));
    }
  };

  const handleSignOut = async () => {
    try {
      dispatch(signOutStart());
      await fetch(`/api/auth/signout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      dispatch(signOutSuccess());
      toast.success('Đã đăng xuất');
      navigate('/signin');
    } catch (err) {
      dispatch(signOutFailure(err.message));
    }
  };

  const handleShowListings = async () => {
    try {
      setLoadingListings(true);
      const res = await fetch(`/api/user/listings/${me?._id}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUserListings(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingListings(false);
    }
  };

  const handleShowOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch('/api/credits/history', {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi tải lịch sử');
      setOrders(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleListingDelete = async (listingId) => {
    if (!confirm('Xoá bài đăng này?')) return;
    try {
      const res = await fetch(`/api/listing/delete/${listingId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Xoá thất bại');
      setUserListings((prev) => prev.filter((l) => l._id !== listingId));
      toast.success('Đã xoá bài đăng');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredListings = (userListings || []).filter((listing) => {
    if (statusFilter === 'all') return true;
    return listing.status === statusFilter;
  });

  const renderOrderStatus = (status) => {
    let color = 'bg-slate-100 text-slate-600';
    let label = 'Chờ xử lý';
    if (status === 'paid') {
      color = 'bg-emerald-100 text-emerald-700';
      label = 'Thành công';
    } else if (status === 'cancelled') {
      color = 'bg-red-100 text-red-700';
      label = 'Đã huỷ';
    }
    return (
      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${color}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
              <div className="relative inline-block mb-4 group">
                <img
                  src={avatarUrl || 'https://placehold.co/200x200?text=User'}
                  alt="avatar"
                  className="w-28 h-28 rounded-full object-cover border-4 border-emerald-50 mx-auto"
                />
                <label className="absolute bottom-0 right-0 bg-slate-800 text-white p-2 rounded-full cursor-pointer hover:bg-slate-700 transition shadow-md">
                  <FaCamera size={14} />
                  <input type="file" hidden onChange={handlePickFile} />
                </label>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    Uploading...
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-slate-900">{me?.username}</h2>
              <p className="text-sm text-slate-500">{me?.email}</p>

              <div className="mt-6 flex flex-col gap-3">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'info' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <FaUserEdit /> Thông tin cá nhân
                </button>
                
                <button 
                  onClick={() => setActiveTab('listings')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'listings' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <FaListAlt /> Quản lý tin đăng
                </button>

                <button 
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'history' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <FaHistory /> Lịch sử giao dịch
                </button>
              </div>

              <div className="my-6 border-t border-slate-100" />

              <button 
                onClick={handleSignOut} 
                className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-red-600 text-sm font-medium transition-colors"
              >
                <FaSignOutAlt /> Đăng xuất
              </button>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-4">Số dư tin đăng</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/10 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-500/20 p-2 rounded-lg">
                      <FaCrown className="text-yellow-400" />
                    </div>
                    <span className="text-sm font-medium">Tin VIP</span>
                  </div>
                  <span className="font-bold text-xl">{vipCredits}</span>
                </div>

                <div className="flex items-center justify-between bg-white/10 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <FaGem className="text-purple-400" />
                    </div>
                    <span className="text-sm font-medium">Tin Premium</span>
                  </div>
                  <span className="font-bold text-xl">{premiumCredits}</span>
                </div>
              </div>

              <Link
                to="/pricing"
                className="block mt-6 text-center bg-white text-slate-900 font-bold py-3 rounded-xl text-sm hover:bg-emerald-50 transition-colors"
              >
                Mua thêm gói tin
              </Link>
            </div>

          </div>

          {/* --- MAIN CONTENT AREA --- */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
            
            {activeTab === 'info' && (
              <div className="animate-fadeIn">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Cập nhật thông tin</h2>
                  <p className="text-slate-500 text-sm mt-1">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên hiển thị</label>
                    <input
                      id="username"
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={formData.username}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      id="email"
                      type="email"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                    <input
                      id="phone"
                      type="tel"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Chưa cập nhật"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
                    <input
                      id="password"
                      type="password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Để trống nếu không đổi"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-slate-900/10 hover:shadow-emerald-600/20 disabled:opacity-70"
                    >
                      {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>

                    <button 
                      type="button" 
                      onClick={handleDelete}
                      className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-2"
                    >
                      <FaTrash size={14} /> Xoá tài khoản
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'listings' && (
              <div className="animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Quản lý tin đăng</h2>
                    <p className="text-slate-500 text-sm mt-1">Danh sách các bất động sản bạn đang rao bán/cho thuê</p>
                  </div>
                  <Link to="/create-listing" className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-md">
                    + Đăng tin mới
                  </Link>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-slate-100">
                  {[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'approved', label: 'Đang hiển thị' },
                    { value: 'pending', label: 'Chờ duyệt' },
                    { value: 'rejected', label: 'Bị từ chối' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatusFilter(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        statusFilter === opt.value
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {loadingListings ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
                  </div>
                ) : filteredListings.length > 0 ? (
                  <div className="space-y-4">
                    {filteredListings.map((listing) => {
                      
                      // ======= LOGIC HIỂN THỊ GIÁ =======
                      const rawPrice = listing.offer 
                        ? listing.discountPrice 
                        : listing.regularPrice;
                        
                      let displayPrice = 'Liên hệ'; // Mặc định
                      
                      // Nếu có giá hiển thị dạng chữ (ví dụ "7 tỷ") thì ưu tiên
                      if (listing.priceDisplay && typeof listing.priceDisplay === 'string' && listing.priceDisplay.trim()) {
                        displayPrice = listing.priceDisplay;
                      } 
                      // Nếu có flag "Liên hệ" hoặc giá <= 0
                      else if (listing.priceContact || !rawPrice || rawPrice <= 0) {
                        displayPrice = 'Liên hệ';
                      } 
                      // Nếu có số tiền cụ thể -> format thành "700 triệu", "7 tỷ"
                      else {
                        displayPrice = formatShortPriceVn(rawPrice);
                      }
                      // ==================================

                      return (
                        <div key={listing._id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all bg-white group">
                          <Link to={`/listing/${listing._id}`} className="shrink-0">
                            <img
                              src={listing.imageUrls?.[0] || 'https://placehold.co/300x200'}
                              alt={listing.name}
                              className="w-full sm:w-32 h-24 object-cover rounded-lg"
                            />
                          </Link>
                          
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors flex-1 min-w-0 pr-2" title={listing.name}>
                                  <Link to={`/listing/${listing._id}`}>{listing.name}</Link>
                                </h3>
                                <div className="shrink-0">
                                  <StatusBadge status={listing.status} />
                                </div>
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-1 mt-1">{listing.address}</p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                              <span className="text-sm font-bold text-slate-900">
                                {displayPrice}
                              </span>
                              <div className="flex gap-3 text-sm font-medium">
                                {listing.status !== 'pending' && (
                                  <Link to={`/update-listing/${listing._id}`} className="text-slate-600 hover:text-emerald-600">
                                    Sửa tin
                                  </Link>
                                )}
                                <button 
                                  onClick={() => handleListingDelete(listing._id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  Xoá tin
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-slate-500 font-medium">Chưa có tin đăng nào</p>
                    <Link to="/create-listing" className="text-emerald-600 text-sm font-bold hover:underline mt-2 inline-block">
                      Đăng tin ngay
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="animate-fadeIn">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Lịch sử giao dịch</h2>
                  <p className="text-slate-500 text-sm mt-1">Danh sách các đơn hàng mua gói tin đã thực hiện</p>
                </div>

                {loadingOrders ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-slate-500 text-sm">Đang tải lịch sử...</p>
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                        <tr>
                          <th className="px-4 py-3">Mã đơn</th>
                          <th className="px-4 py-3">Gói tin</th>
                          <th className="px-4 py-3">Thanh toán</th>
                          <th className="px-4 py-3">Trạng thái</th>
                          <th className="px-4 py-3">Ngày tạo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.map((order) => {
                          const item = order.items?.[0] || {};
                          return (
                            <tr key={order._id} className="hover:bg-slate-50 transition-colors bg-white">
                              <td className="px-4 py-3 font-medium text-slate-900">
                                {order.payosOrderCode || order._id.slice(-6).toUpperCase()}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-slate-800">{item.label}</div>
                                <div className="text-xs text-slate-400">SL: {item.quantity}</div>
                              </td>
                              <td className="px-4 py-3 font-semibold text-emerald-600">
                                {order.totalAmount?.toLocaleString()} đ
                              </td>
                              <td className="px-4 py-3">
                                {renderOrderStatus(order.status)}
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs">
                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="text-4xl mb-3 text-slate-300">
                      <FaReceipt className="mx-auto" />
                    </div>
                    <p className="text-slate-500 font-medium">Bạn chưa có đơn hàng nào</p>
                    <Link to="/pricing" className="text-emerald-600 text-sm font-bold hover:underline mt-2 inline-block">
                      Mua gói tin ngay
                    </Link>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    approved: { text: 'Đã duyệt', class: 'bg-emerald-100 text-emerald-700' },
    pending: { text: 'Chờ duyệt', class: 'bg-amber-100 text-amber-700' },
    rejected: { text: 'Bị từ chối', class: 'bg-red-100 text-red-700' },
  };
  const current = config[status] || config.approved;
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${current.class}`}>
      {current.text}
    </span>
  );
}