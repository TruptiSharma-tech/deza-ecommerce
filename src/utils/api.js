// Central API utility for DEZA e-commerce
// All API calls go through this file to the Express + MongoDB backend

const BASE_URL = "http://localhost:5000/api";

// ── Helper ─────────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("deza_token");

const headers = (extra = {}) => ({
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...extra,
});

async function request(path, options = {}) {
    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            headers: headers(),
            ...options,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        return data;
    } catch (err) {
        throw err;
    }
}

// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════
export const apiRegister = (payload) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(payload) });

export const apiLogin = (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) });

export const apiAdminLogin = (payload) =>
    request("/auth/admin-login", { method: "POST", body: JSON.stringify(payload) });

export const apiGetUsers = () => request("/auth/users");
export const apiDeleteUser = (id) => request(`/auth/users/${id}`, { method: "DELETE" });

export const apiForgotPassword = (payload) =>
    request("/auth/forgot-password", { method: "POST", body: JSON.stringify(payload) });

export const apiResetPassword = (payload) =>
    request("/auth/reset-password", { method: "POST", body: JSON.stringify(payload) });

export const apiCreateAdmin = (payload) =>
    request("/auth/create-admin", { method: "POST", body: JSON.stringify(payload) });

// ══════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════
export const apiGetProducts = () => request("/products");

export const apiGetProduct = (id) => request(`/products/${id}`);

export const apiAddProduct = (payload) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) });

export const apiUpdateProduct = (id, payload) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const apiDeleteProduct = (id) =>
    request(`/products/${id}`, { method: "DELETE" });

// ══════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════
export const apiGetOrders = () => request("/orders");

export const apiGetMyOrders = (email) => request(`/orders/my/${encodeURIComponent(email)}`);

export const apiCreateOrder = (payload) =>
    request("/orders", { method: "POST", body: JSON.stringify(payload) });

export const apiUpdateOrderStatus = (id, status) =>
    request(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const apiCancelOrder = (id) =>
    request(`/orders/${id}/cancel`, { method: "PATCH" });

export const apiReturnOrder = (id, payload) =>
    request(`/orders/${id}/return`, { method: "PATCH", body: JSON.stringify(payload) });

export const apiRefundOrder = (id) =>
    request(`/orders/${id}/refund`, { method: "PATCH" });

// ══════════════════════════════════════════════════════════════
//  QUERIES
// ══════════════════════════════════════════════════════════════
export const apiGetQueries = () => request("/queries");

export const apiGetMyQueries = (email) => request(`/queries/my/${encodeURIComponent(email)}`);

export const apiSubmitQuery = (payload) =>
    request("/queries", { method: "POST", body: JSON.stringify(payload) });

export const apiUpdateQuery = (id, payload) =>
    request(`/queries/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

export const apiReplyQuery = (id, adminReply) =>
    request(`/queries/${id}/reply`, { method: "PATCH", body: JSON.stringify({ adminReply }) });

export const apiInitiateRefund = (id) =>
    request(`/queries/${id}/refund`, { method: "POST" });

// ══════════════════════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════════════════════
export const apiGetReviews = () => request("/reviews");

export const apiGetProductReviews = (productId) =>
    request(`/reviews/product/${productId}`);

export const apiSubmitReview = (payload) =>
    request("/reviews", { method: "POST", body: JSON.stringify(payload) });

export const apiDeleteReview = (id) =>
    request(`/reviews/${id}`, { method: "DELETE" });

// ══════════════════════════════════════════════════════════════
//  ADMIN / SYSTEM COLLECTIONS
// ══════════════════════════════════════════════════════════════
export const apiGetCategories = () => request("/admin/categories");
export const apiAddCategory = (payload) =>
    request("/admin/categories", { method: "POST", body: JSON.stringify(payload) });

export const apiGetBrands = () => request("/admin/brands");
export const apiAddBrand = (payload) =>
    request("/admin/brands", { method: "POST", body: JSON.stringify(payload) });

export const apiGetSubscribers = () => request("/admin/subscribers");
export const apiSubscribe = (email) =>
    request("/admin/subscribe", { method: "POST", body: JSON.stringify({ email }) });

export const apiGetCoupons = () => request("/admin/coupons");
export const apiAddCoupon = (payload) =>
    request("/admin/coupons", { method: "POST", body: JSON.stringify(payload) });

export const apiGetAuditLogs = () => request("/admin/audit-logs");

// ══════════════════════════════════════════════════════════════
//  PAYMENTS (Razorpay)
// ══════════════════════════════════════════════════════════════
export const apiCreateRazorpayOrder = (payload) =>
    request("/payments/create-order", { method: "POST", body: JSON.stringify(payload) });

export const apiVerifyRazorpayPayment = (payload) =>
    request("/payments/verify-payment", { method: "POST", body: JSON.stringify(payload) });
