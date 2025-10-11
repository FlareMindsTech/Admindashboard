import axios from "axios";

// === Configuration ===
const API_BASE_URL = "https://boutique-ecommerce-1.onrender.com"; // No trailing slash (Correct)
const TIMEOUT_MS = 10000;

// =========================================================
// 1️⃣ GENERAL USER/CUSTOMER AXIOS INSTANCE
// =========================================================
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Interceptor for General User Authentication (using 'token') ---
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =========================================================
// 2️⃣ ADMIN / SUPER ADMIN AXIOS INSTANCE
// =========================================================
const adminAxiosInstance = axios.create({
  baseURL: API_BASE_URL, // This is correct, as the /api is added in the component file
  timeout: TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Interceptor for Admin Authentication (using 'adminToken') ---
adminAxiosInstance.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =========================================================
// 3️⃣ COMMON RESPONSE INTERCEPTOR (401 Unauthorized handler)
// =========================================================
const unauthorizedResponseHandler = (error) => {
  if (error.response && error.response.status === 401) {
    console.warn("⚠️ Unauthorized (401). Clearing auth data...");

    // Clear tokens
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    // Optional: redirect to login page if needed
    // window.location.href = "/admin/login";
  }
  return Promise.reject(error);
};

// Attach global handler
axiosInstance.interceptors.response.use(
  (res) => res,
  unauthorizedResponseHandler
);
adminAxiosInstance.interceptors.response.use(
  (res) => res,
  unauthorizedResponseHandler
);

// =========================================================
// ✅ EXPORTS
// =========================================================
export default axiosInstance;
export { adminAxiosInstance };