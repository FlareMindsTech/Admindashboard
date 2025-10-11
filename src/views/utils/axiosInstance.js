import axios from "axios";

// --- Configuration ---
const API_BASE_URL = "https://boutique-ecommerce-1.onrender.com/";
const BASE_URL = "https://boutique-ecommerce-1.onrender.com/api";
const TIMEOUT_MS = 10000;

// =========================================================
// 1. GENERAL USER AXIOS INSTANCE
// =========================================================
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized (401): Token expired or invalid.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Optional: window.location.href = "/auth/signin";
    }
    return Promise.reject(error);
  }
);

// =========================================================
// 2. ADMIN AXIOS INSTANCE
// =========================================================
const adminAxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

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

adminAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Admin Unauthorized (401): Token expired or invalid.");
      localStorage.removeItem("adminToken");
      // Optional: window.location.href = "/auth/signin";
    }
    return Promise.reject(error);
  }
);

// =========================================================
// 3. EXPORTS
// =========================================================
export default axiosInstance;
export { adminAxiosInstance };

// =========================================================
// 4. API CALL FUNCTION (Example)
// =========================================================
export const getAllAdmins = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/admins/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token: token,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching admins:", error);
    throw error;
  }
};
