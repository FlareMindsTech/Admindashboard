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
// =========================================================
//5. API CALL FUNCTION (Example)
// =========================================================

export const getAllCategories = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/categories/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token: token, // send the stored token
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data; // should return { categories: [...] }
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};


export const createCategories = async (categoryData) => {
  try {
    const token = localStorage.getItem("token"); // get token from localStorage
    const response = await fetch(`${BASE_URL}/categories/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: token, // send the stored token
      },
      body: JSON.stringify(categoryData), // send category data as JSON
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status}`);
    }

    const data = await response.json();
    return data; // should return the created category
  } catch (error) {
    console.error("Error creating category:", error);
  }}
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

// =========================================================
//5. API CALL FUNCTION (Example)
// =========================================================
// export const getAllProducts = async () => {
//   try {
//     const token = localStorage.getItem("token");
//     if (!token) throw new Error("Token not found");

//     const response = await fetch(`${BASE_URL}/products/all`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         token,
//       },
//     });

//     const text = await response.text(); // get response as text first
//     let data;
//     try {
//       data = JSON.parse(text); // try parsing JSON
//     } catch {
//       console.error("Non-JSON response:", text);
//       throw new Error("Invalid JSON response from server");
//     }

//     if (!response.ok) {
//       throw new Error(data.message || `Error: ${response.status}`);
//     }

//     return data; // { products: [...] }
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     throw error;
//   }
// };


// export const createProduct = async (productData) => {
//   try {
//     const token = localStorage.getItem("token");
//     if (!token) throw new Error("Token not found");

//     // Ensure categoryId is present
//     if (!productData.categoryId) {
//       throw new Error("Product must have a categoryId");
//     }

//     // Optional: convert variants string to array if provided as comma-separated
//     if (productData.variants && typeof productData.variants === "string") {
//       productData.variants = productData.variants.split(",").map(v => v.trim());
//     }

//     const response = await fetch(`${BASE_URL}/products/create`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         token,
//       },
//       body: JSON.stringify(productData),
//     });

//     const text = await response.text();
//     let data;
//     try {
//       data = JSON.parse(text);
//     } catch {
//       console.error("Non-JSON response:", text);
//       throw new Error("Invalid JSON response from server");
//     }

//     if (!response.ok) {
//       throw new Error(data.message || `Error: ${response.status}`);
//     }

//     return data; // { product: {...} }
//   } catch (error) {
//     console.error("Error creating product:", error);
//     throw error;
//   }
// };
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


