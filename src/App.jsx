import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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
import AdminProtectedRoute from "./components/AdminProtectedRoute";

// PRELOADER FOR SUSPENSE
const LoadingScreen = () => (
  <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f9f9f9" }}>
    <h2 style={{ color: "#d4af37", fontFamily: "Times New Roman" }}>DEZA... Loading</h2>
  </div>
);

export default function App() {
  return (
    <Router>
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
        </Routes>
      </Suspense>

      <Footer />
    </Router>
  );
}
