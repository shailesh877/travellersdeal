import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/CartDrawer';

import Home from './pages/Home';
import ExperienceList from './pages/ExperienceList';
import ExperienceDetail from './pages/ExperienceDetail';
import Payment from './pages/Payment';
import Completion from './pages/Completion';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VendorDashboard from './pages/VendorDashboard';
import AddExperience from './pages/AddExperience';

import UserProfile from './pages/UserProfile';

import VendorRegister from './pages/VendorRegister';
import AdminLogin from './pages/AdminLogin';
import AdminVendorDetails from './pages/AdminVendorDetails';
import AdminUserDetails from './pages/AdminUserDetails';
import AdminExperienceDetails from './pages/AdminExperienceDetails';
import AdminTestimonials from './pages/AdminTestimonials';
import SupplierPrivacyPolicy from './pages/SupplierPrivacyPolicy';
import PaymentCollectionPolicy from './pages/PaymentCollectionPolicy';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';

// Scroll to top on every route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
};

// Conditionally render footer to hide it on Admin and Vendor dashboard pages
const ConditionalFooter = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin') || pathname.startsWith('/vendor')) {
    return null;
  }
  return <Footer />;
};
function App() {
  return (
    <AuthProvider>
      <Router>
        <CartProvider>
          <ScrollToTop />
          <Header />
          <CartDrawer />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/experiences" element={<ExperienceList />} />
              <Route path="/experience/:id" element={<ExperienceDetail />} />
              <Route path="/checkout" element={<Payment />} />
              <Route path="/completion" element={<Completion />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/id/:id" element={<AdminVendorDetails />} />
              <Route path="/admin/user/:id" element={<AdminUserDetails />} />
              <Route path="/admin/experience/:id" element={<AdminExperienceDetails />} />
              <Route path="/admin/testimonials" element={<AdminTestimonials />} />
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
              <Route path="/vendor/add" element={<AddExperience />} />
              <Route path="/vendor/edit/:id" element={<AddExperience />} />
              <Route path="/vendor/register" element={<VendorRegister />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/supplier-privacy-policy" element={<SupplierPrivacyPolicy />} />
              <Route path="/payment-collection-policy" element={<PaymentCollectionPolicy />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>
          <ConditionalFooter />
        </CartProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
