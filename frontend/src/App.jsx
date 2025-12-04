import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from 'react-hot-toast';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Profile from './pages/Profile';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import CreateListing from './pages/CreateListing';
import Listing from './pages/Listing';
import UpdateListing from './pages/UpdateListing';
import Search from './pages/Search';
import PricePredictor from './pages/predict';
import Guide from './pages/Guide';
import Faq from './pages/Faq';
import Pricing from './pages/Pricing';
import Checkout from './pages/Checkout';
import UserProfile from './pages/UserProfile';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminUsers from './pages/admin/AdminUsers';
import AdminListings from './pages/admin/AdminListings';
import AdminPendingListings from './pages/admin/AdminPendingListings';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      
      {/* Header nằm cố định trên cùng */}
      <Header />


      <div className="flex flex-col min-h-screen pt-16 md:pt-20">
        <main className="flex-grow bg-slate-50/30">
          <Routes>
            {/* --- Public Routes --- */}
            <Route path='/' element={<Home />} />
            <Route path='/about' element={<About />} />
            <Route path='/listing/:listingId' element={<Listing />} />
            <Route path='/search' element={<Search />} />
            <Route path='/dudoan' element={<PricePredictor />} />
            <Route path='/signin' element={<Signin />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/guide' element={<Guide />} />
            <Route path='/faq' element={<Faq />} />
            <Route path='/pricing' element={<Pricing />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            
            {/* --- Private Routes --- */}
            <Route element={<PrivateRoute />}>
              <Route path='/profile' element={<Profile />} />
              <Route path='/create-listing' element={<CreateListing />} />
              <Route path='/update-listing/:listingId' element={<UpdateListing />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
            </Route>

            {/* --- Admin Routes --- */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="listings" element={<AdminListings />} />
                <Route path="pending-listings" element={<AdminPendingListings />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="coupons" element={<AdminCoupons />} />
              </Route>
            </Route>
          </Routes>
        </main>

        <Footer />
      </div>

      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
    </BrowserRouter>
  );
}