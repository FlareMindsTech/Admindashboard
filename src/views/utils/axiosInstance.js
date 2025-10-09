import axios from 'axios';

// --- Configuration ---
// IMPORTANT: Replace this with your actual backend API URL.
const API_BASE_URL = 'https://boutique-ecommerce-1.onrender.com/'; 

// --- Variable for Admin JWT Token ---
// Retrieve the 'adminToken' from local storage and store it in a variable.
// NOTE: You must ensure your login process is storing the admin token 
// with the key 'adminToken' (or whatever key you choose).
const ADMIN_JWT_TOKEN = localStorage.getItem('adminToken');

// You can use this variable to test authenticated admin routes
// or to conditionally modify the headers for *specific* admin requests.
// For *most* requests (user/general), you should still rely on the 'token' key,
// as your interceptor currently does.

// Create a custom Axios instance
const axiosInstance = axios.create({
baseURL: API_BASE_URL,
 timeout: 10000, 
 headers: {
'Content-Type': 'application/json',
 },
});

// --- Interceptor to Inject JWT Token (for general user/customer) ---
axiosInstance.interceptors.request.use(
(config) => {
// 1. Get the general user/customer JWT token from local storage
 const token = localStorage.getItem('token'); // Assumes 'token' is the standard user/customer key

 // 2. If the token exists, attach it to the Authorization header
if (token) {
config.headers.Authorization = `Bearer ${token}`;
 }

    // If you wanted to use the 'ADMIN_JWT_TOKEN' for all requests (only if an admin is logged in):
 // if (ADMIN_JWT_TOKEN) {
    //   config.headers.Authorization = `Bearer ${ADMIN_JWT_TOKEN}`;
    // }

 return config;
 },
 (error) => {
 return Promise.reject(error);
 }
);

// --- Optional: Interceptor to Handle 401 Unauthorized Responses ---
// ... (The rest of your response interceptor remains the same)

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
 console.error('Unauthorized (401) received. Token may be expired or invalid.');

  localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Also clear admin specific data if you use different keys
      localStorage.removeItem('adminToken');
localStorage.removeItem('adminUser');
  }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { ADMIN_JWT_TOKEN }; // Export the variable for direct use in admin-specific components