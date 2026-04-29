import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import MobileBottomNav from "./components/MobileBottomNav";
import AccountSidebar from "./components/AccountSidebar";
import ScrollProgress from "./components/ScrollProgress";
import PageWrapper from "./components/PageWrapper";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { Toaster } from "react-hot-toast";

// ✅ LAZY LOADED PAGES FOR FASTER INITIAL LOAD TIME
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Shop = lazy(() => import("./pages/Shop"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentGateway = lazy(() => import("./pages/PaymentGateway"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Orders = lazy(() => import("./pages/Orders"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const OrderTracking = lazy(() => import("./pages/TrackOrder"));
const MyTickets = lazy(() => import("./pages/MyTickets"));
const Contact = lazy(() => import("./pages/Contact"));

// POLICIES
const Terms = lazy(() => import("./pages/Terms"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ReturnRefund = lazy(() => import("./pages/ReturnRefund"));

// ADMIN
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

// PRELOADER FOR SUSPENSE
const LoadingScreen = () => (
  <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#050505" }}>
    <h2 style={{ color: "#d4af37", fontFamily: "Playfair Display, serif", letterSpacing: "4px" }}>DEZA</h2>
  </div>
);

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      <ScrollProgress />
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 100000 }} // Ensure it's above the OTP Modal
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
            padding: '12px 24px',
          },
          success: {
            iconTheme: {
              primary: '#D4AF37',
              secondary: '#1a1a1a',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff4b4b',
              secondary: '#1a1a1a',
            },
          },
        }}
      />
      <ScrollToTop />
      {!isAdminRoute && <Navbar />}

      <Suspense fallback={<LoadingScreen />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* MAIN PAGES */}
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/shop" element={<PageWrapper><Shop /></PageWrapper>} />
            <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
            <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />

            {/* PRODUCT */}
            <Route path="/product/:id" element={<PageWrapper><ProductDetails /></PageWrapper>} />

            {/* CART & WISHLIST */}
            <Route path="/cart" element={<PageWrapper><Cart /></PageWrapper>} />
            <Route path="/wishlist" element={<PageWrapper><Wishlist /></PageWrapper>} />

            {/* AUTH */}
            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
            <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
            <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
            <Route path="/reset-password" element={<PageWrapper><ResetPassword /></PageWrapper>} />

            {/* CHECKOUT FLOW */}
            <Route path="/checkout" element={<PageWrapper><Checkout /></PageWrapper>} />
            <Route path="/payment" element={<PageWrapper><PaymentGateway /></PageWrapper>} />
            <Route path="/checkout/success" element={<PageWrapper><OrderSuccess /></PageWrapper>} />

            {/* ORDERS */}
            <Route path="/orders" element={<PageWrapper><Orders /></PageWrapper>} />
            <Route path="/track-order/:orderId" element={<PageWrapper><OrderTracking /></PageWrapper>} />
            <Route path="/my-tickets" element={<PageWrapper><MyTickets /></PageWrapper>} />

            {/* POLICIES */}
            <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
            <Route path="/privacy-policy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
            <Route path="/return-refund" element={<PageWrapper><ReturnRefund /></PageWrapper>} />

            {/* ADMIN */}
            <Route path="/admin-login" element={<PageWrapper><AdminLogin /></PageWrapper>} />
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <PageWrapper><Admin /></PageWrapper>
                </AdminProtectedRoute>
              }
            />

            {/* 404 CATCH-ALL */}
            <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      {!isAdminRoute && (
        <>
          <Footer />
          <MobileBottomNav />
          <AccountSidebar />
        </>
      )}
    </>
  );
}
