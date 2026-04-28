// Central API utility for DEZA e-commerce
// All API calls go through this file to the Express + MongoDB backend

const getBaseUrl = () => {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const envUrl = import.meta.env.VITE_API_URL;
    
    // If we have an env URL and we're on localhost, use it
    if (envUrl && isLocalhost) return envUrl;
    
    // If we're on production or a mobile device (non-localhost), 
    // and the envUrl is NOT localhost, use it.
    // Otherwise fallback to the hardcoded production URL.
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
        return envUrl;
    }
    
    return "https://deza-ecommerce.onrender.com/api";
};

let BASE_URL = getBaseUrl();
if (BASE_URL.endsWith("/")) BASE_URL = BASE_URL.slice(0, -1);
if (!BASE_URL.endsWith("/api")) BASE_URL += "/api";

console.log("🚀 DEZA API initialized at:", BASE_URL);


// ── Helper ─────────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("deza_token");

const headers = (extra = {}) => ({
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...extra,
});

// ── Simple Persistent Cache for GET requests ────────────────────────────────
const CACHE_KEY = "deza_api_cache";
const CACHE_EXPIRY = 60 * 1000; // 1 minute for persistent cache

const getPersistentCache = () => {
    try {
        const stored = localStorage.getItem(CACHE_KEY);
        return stored ? new Map(JSON.parse(stored)) : new Map();
    } catch (e) {
        return new Map();
    }
};

const savePersistentCache = (cache) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(cache.entries())));
    } catch (e) {
        console.warn("Failed to save API cache to localStorage", e);
    }
};

const apiCache = getPersistentCache();

async function request(path, options = {}) {
    const isGet = !options.method || options.method === "GET";
    const isSensitive = path.includes("/me") || path.includes("/sync") || path.includes("/me");
    const cacheKey = path;

    // Return cached data if available, not expired, and NOT sensitive
    const isAdminPath = path.startsWith("/admin"); // Bypass cache for all admin paths including hero-settings
    
    if (isGet && !isSensitive && !isAdminPath) {
        const cached = apiCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY)) {
            // stale-while-revalidate: return cached, refresh in background if > 30s old
            if (Date.now() - cached.timestamp > 30 * 1000) {
                fetch(`${BASE_URL}${path}`, { headers: headers(), ...options })
                    .then(res => res.json())
                    .then(data => {
                        apiCache.set(cacheKey, { data, timestamp: Date.now() });
                        savePersistentCache(apiCache);
                    })
                    .catch(() => {});
            }
            return cached.data;
        }
    }

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            headers: headers(),
            ...options,
        });
        const data = await res.json();
        if (!res.ok) {
            console.error(`❌ API Error [${res.status}] ${path}:`, data);
            throw new Error(data.error || "Request failed");
        }

        // Cache successful GET responses
        if (isGet) {
            apiCache.set(cacheKey, { data, timestamp: Date.now() });
            savePersistentCache(apiCache);
        } else {
            // Invalidate cache for mutations on the same path or related paths
            if (path.includes("/products")) apiCache.delete("/products");
            if (path.includes("/admin/hero-settings")) apiCache.delete("/admin/hero-settings");
            if (path.includes("/orders")) {
                apiCache.forEach((_, key) => {
                    if (key.includes("/orders")) apiCache.delete(key);
                });
            }
            apiCache.delete(path);
            savePersistentCache(apiCache);
        }

        return data;
    } catch (err) {
        console.error(`🚨 Network Error ${path}:`, err.message);
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

export const apiGetProfile = () => request("/auth/me");

export const apiGetUsers = () => request("/auth/users");
export const apiDeleteUser = (id) => request(`/auth/users/${id}`, { method: "DELETE" });

export const apiForgotPassword = (payload) =>
    request("/auth/forgot-password", { method: "POST", body: JSON.stringify(payload) });

export const apiResetPassword = (payload) =>
    request("/auth/reset-password", { method: "POST", body: JSON.stringify(payload) });

export const apiCreateAdmin = (payload) =>
    request("/auth/create-admin", { method: "POST", body: JSON.stringify(payload) });

export const apiSyncUserData = (payload) =>
    request("/auth/sync", { method: "POST", body: JSON.stringify(payload) });

// ══════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════
// For admin to see all, including archived
export const apiGetProducts = (includeArchived = false, page = 1, limit = 20) =>
    request(`/products?page=${page}&limit=${limit}${includeArchived ? "&includeArchived=true" : ""}`);

export const apiGetProduct = (id) => request(`/products/${id}`);

export const apiAddProduct = (payload) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) });

export const apiUpdateProduct = (id, payload) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const apiDeleteProduct = (id) =>
    request(`/products/${id}/permanent`, { method: "DELETE" });

export const apiArchiveProduct = (id) =>
    request(`/products/${id}/archive`, { method: "PATCH" });

export const apiUnarchiveProduct = (id) =>
    request(`/products/${id}/unarchive`, { method: "PATCH" });

// ══════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════
export const apiGetOrders = () => request("/orders");

export const apiGetMyOrders = () => request("/orders/me");

export const apiCreateOrder = (payload) =>
    request("/orders", { method: "POST", body: JSON.stringify(payload) });

export const apiUpdateOrderStatus = (id, status, comment, trackingNumber, deliveryCompany) =>
    request(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, comment, trackingNumber, deliveryCompany }) });

export const apiToggleLiveTracking = (id, isActive, lat, lng) =>
    request(`/orders/${id}/live-tracking`, { method: "PATCH", body: JSON.stringify({ isActive, lat, lng }) });

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
export const apiDeleteCategory = (id) =>
    request(`/admin/categories/${id}`, { method: "DELETE" });
export const apiArchiveCategory = (id) =>
    request(`/admin/categories/${id}/archive`, { method: "PATCH" });
export const apiUnarchiveCategory = (id) =>
    request(`/admin/categories/${id}/unarchive`, { method: "PATCH" });

export const apiGetBrands = () => request("/admin/brands");
export const apiAddBrand = (payload) =>
    request("/admin/brands", { method: "POST", body: JSON.stringify(payload) });
export const apiDeleteBrand = (id) =>
    request(`/admin/brands/${id}`, { method: "DELETE" });
export const apiArchiveBrand = (id) =>
    request(`/admin/brands/${id}/archive`, { method: "PATCH" });
export const apiUnarchiveBrand = (id) =>
    request(`/admin/brands/${id}/unarchive`, { method: "PATCH" });

export const apiGetSubscribers = () => request("/admin/subscribers");
export const apiSubscribe = (email) =>
    request("/admin/subscribe", { method: "POST", body: JSON.stringify({ email }) });

export const apiGetCoupons = () => request("/admin/coupons");
export const apiAddCoupon = (payload) =>
    request("/admin/coupons", { method: "POST", body: JSON.stringify(payload) });

export const apiGetAuditLogs = () => request("/admin/audit-logs");

// ══════════════════════════════════════════════════════════════
//  HERO SETTINGS (Home Page — Admin editable)
// ══════════════════════════════════════════════════════════════
export const apiGetHeroSettings = () => request("/admin/hero-settings");
export const apiUpdateHeroSettings = (payload) =>
    request("/admin/hero-settings", { method: "PUT", body: JSON.stringify(payload) });

export const apiSendNewsletter = (payload) =>
    request("/admin/newsletter", { method: "POST", body: JSON.stringify(payload) });

// ══════════════════════════════════════════════════════════════
//  PAYMENTS (Razorpay)
// ══════════════════════════════════════════════════════════════
export const apiCreateRazorpayOrder = (payload) =>
    request("/payments/create-order", { method: "POST", body: JSON.stringify(payload) });

export const apiVerifyRazorpayPayment = (payload) =>
    request("/payments/verify-payment", { method: "POST", body: JSON.stringify(payload) });


