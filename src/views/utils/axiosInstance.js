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
    throw error;
  }
};

// =========================================================
//5. API CALL FUNCTION (Example)
// =========================================================
export const getAllProducts = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/products/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        token: token, // send the stored token
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`); // throws for 4xx or 5xx
    }

    const data = await response.json();
    return data; // should return { products: [...] }
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// 🟢 Create a new product
const uploadImage = async (file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/admin/products/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  // If server returns non-OK, log full response text
  if (!res.ok) {
    const text = await res.text();
    console.error("Error uploading image, backend response:", text);
    throw new Error("Image upload failed");
  }

  // Parse JSON returned by backend
  const data = await res.json();
  return data.url; // backend must return { url: "<image URL>" }
};

// Main function to create product
export const createProducts = async (productData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authorization token not found.");

    // Validate required fields
    if (
      !productData.name ||
      !productData.category ||
      !productData.price ||
      !productData.stock
    ) {
      throw new Error("Please fill all required fields before submitting the product.");
    }

    console.log("🧾 Product data before uploading images:", productData);

    // Step 1: Upload images if any
    let imageUrls = [];
    if (productData.imgFiles && productData.imgFiles.length > 0) {
      imageUrls = await Promise.all(
        productData.imgFiles.map((file) => uploadImage(file))
      );
    }

    console.log("🖼️ Uploaded image URLs:", imageUrls);

    // Step 2: Prepare product JSON
    const productPayload = {
      name: productData.name.trim(),
      description: productData.description?.trim() || "",
      category: productData.category,
      variants: [
        {
          color: productData.color || "default",
          size: productData.size || "default",
          price: Number(productData.price),
          stock: Number(productData.stock),
          sku:
            productData.sku ||
            `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
      ],
      images: imageUrls,
    };

    console.log("📡 Sending product JSON to API:", productPayload);

    // Step 3: Create product
    const res = await fetch(`${BASE_URL}/products/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token,
      },
      body: JSON.stringify(productPayload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = "Failed to create product.";

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        console.warn("Non-JSON error response from server:", errorText);
      }

      throw new Error(errorMessage);
    }

    const data = await res.json();
    console.log("✅ Product created successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Error creating product:", error.message);
    throw error;
  }
};