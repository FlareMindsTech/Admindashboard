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

// ===== Admin API functions =====

// Get all admins
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

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching admins:", error);
    throw error;
  }
};

// Create a new admin
export const createAdmin = async (adminData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/admins/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: token,
      },
      body: JSON.stringify(adminData),
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating admin:", error);
    throw error;
  }
};

// Update an existing admin
export const updateAdmin = async (adminId, updatedData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/admins/update/${adminId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        token: token,
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating admin:", error);
    throw error;
  }
};


//  USERS 

// ===== User API functions =====

// Get all users
export const getAllUsers = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/users/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token: token,
      },
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Create a new user
export const createUser = async (userData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: token,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Update an existing user
export const updateUser = async (userId, updatedData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/users/update/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        token: token,
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};