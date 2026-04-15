import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

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
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { Toaster } from "react-hot-toast";

// PRELOADER FOR SUSPENSE
const LoadingScreen = () => (
  <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f9f9f9" }}>
    <h2 style={{ color: "#d4af37", fontFamily: "Times New Roman" }}>DEZA... Loading</h2>
  </div>
);

import { AuthProvider } from "./context/AuthContext";
import { ShopProvider } from "./context/ShopContext";
import ScrollProgress from "./components/ScrollProgress";

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <Router>
          <ScrollProgress />
          <Toaster
            position="top-center"
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
          <Navbar />

          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* MAIN PAGES */}
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* PRODUCT */}
              <Route path="/product/:id" element={<ProductDetails />} />

              {/* CART & WISHLIST */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />

              {/* AUTH */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* CHECKOUT FLOW */}
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment" element={<PaymentGateway />} />
              <Route path="/checkout/success" element={<OrderSuccess />} />

              {/* ORDERS */}
              <Route path="/orders" element={<Orders />} />
              <Route path="/track-order/:orderId" element={<OrderTracking />} />
              <Route path="/my-tickets" element={<MyTickets />} />

              {/* POLICIES */}
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/return-refund" element={<ReturnRefund />} />

              {/* ADMIN */}
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <Admin />
                  </AdminProtectedRoute>
                }
              />

              {/* 404 CATCH-ALL */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          <Footer />
        </Router>
      </ShopProvider>
    </AuthProvider>
  );
}
