//axiosInstance.js
import axios from "axios";

// --- Configuration ---
const API_BASE_URL = "https://server-e-fx6s.onrender.com/";
const BASE_URL = "https://server-e-fx6s.onrender.com/api";
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
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
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
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

adminAxiosInstance.interceptors.request.use(
  (config) => {
    const adminToken =
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken");
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

    // Clear both localStorage & sessionStorage tokens
    localStorage.clear();
    sessionStorage.clear();

    // Optional redirect
    // window.location.href = "/#/auth/signin";
  }
  return Promise.reject(error);
};

axiosInstance.interceptors.response.use(
  (res) => res,
  unauthorizedResponseHandler
);

adminAxiosInstance.interceptors.response.use(
  (response) => response,
  unauthorizedResponseHandler
);

// =========================================================
// 4. EXPORTS
// =========================================================
export default axiosInstance;
export { adminAxiosInstance };

// =========================================================
// 5. Helper function to get token (checks both storages)
// =========================================================
const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

// =========================================================
// 6. API CALL FUNCTIONS
// =========================================================

// ----- Admin APIs -----
export const getAllAdmins = async () => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/admins/all`, {
      method: "GET",
      headers: { "Content-Type": "application/json", token },
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching admins:", error);
    throw error;
  }
};

export const createAdmin = async (adminData) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/admins/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(adminData),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating admin:", error);
    throw error;
  }
};

export const updateAdmin = async (adminId, updatedData) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/admins/update/${adminId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating admin:", error);
    throw error;
  }
};

export const inActiveAdmin = async (adminId) => {
  try {
    const token = getToken();

    const response = await fetch(`${BASE_URL}/admins/delete/${adminId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        token,
      },
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);

    return await response.json();   // Example: { message: "Admin marked as Inactive successfully" }

  } catch (error) {
    console.error("Error deleting admin:", error);
    throw error;
  }
};


// ----- Category APIs -----
export const getAllCategories = async () => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/categories/all`, {
      method: "GET",
      headers: { "Content-Type": "application/json", token },
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const createCategories = async (categoryData) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/categories/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

export const updateCategories = async (categoryId, updatedData) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/categories/update/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};


export const deleteCategory = async (categoryId) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/categories/delete/${categoryId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token },
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);

    return await response.json(); 
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};


// ----- Product APIs -----
export const getAllProducts = async () => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/products/all`, {
      method: "GET",
      headers: { "Content-Type": "application/json", token },
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const createProducts = async (productData) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/products/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "token": token 
      },
      body: JSON.stringify(productData),
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
  
      let errorMessage = `Error: ${response.status}`;
      
      try {
        const errorData = await response.json();

        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {

        const text = await response.text();
   
        errorMessage = text || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
  
    return data;
  } catch (error) {
    throw error; 
  }
};

export const uploadImage = async (file) => {
  try {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BASE_URL}/products/upload`, {
      method: "POST",
      headers: { token },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Error uploading image, backend response:", text);
      throw new Error("Image upload failed");
    }

    const data = await res.json();
    return data.url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const updateProducts = async (productId, updatedData) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/products/update/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProducts = async (productId) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/products/delete/${productId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", token },
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// ----- User APIs -----
export const getAllUsers = async () => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/users/all`, {
      method: "GET",
      headers: { "Content-Type": "application/json", token },
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (userId, updatedData) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/users/update/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/users/delete/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        token,
      },
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};


export const getAllOrders = async () => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/orders/all`, {
      method: "GET",
      headers: { "Content-Type": "application/json", token },
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching Orders:", error);
    throw error;
  }
};

export const createOrders = async (categoryData) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/Orders/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

export const updateOrders = async (orderId, updatedData) => {
  try {
    const token = getToken();

    const response = await fetch(`${BASE_URL}/orders/update/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        token,
      },
      body: JSON.stringify(updatedData), // use passed data dynamically
    });

    if (!response.ok) {
      throw new Error(`Error updating order: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};


// Upload Product image

// Add this function to your existing axiosInstance.js file, after the existing uploadImage function

// Upload Product Image with productId
export const uploadProductImage = async (productId, file) => {
  try {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId);

    const res = await fetch(`${BASE_URL}/products/upload`, {
      method: "POST",
      headers: { 
        token: `${token}`,
        // Don't set Content-Type for FormData, let browser set it
      },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Upload failed response:", errorText);
      throw new Error(`Image upload failed: ${res.status} ${res.statusText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Delete Product Image
export const deleteProductImage = async (productId, public_id) => {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/products/delete-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: `${token}`,
      },
      body: JSON.stringify({ productId, public_id }),
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};
