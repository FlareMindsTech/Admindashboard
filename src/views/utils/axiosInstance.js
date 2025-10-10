import axios from 'axios';

// --- Configuration ---
// IMPORTANT: Replace this with your actual backend API URL.
const API_BASE_URL = 'https://boutique-ecommerce-1.onrender.com/'; 
const TIMEOUT_MS = 10000;

// =========================================================
// 1. GENERAL USER/CUSTOMER AXIOS INSTANCE (axiosInstance)
//    - Uses 'token' key from localStorage
// =========================================================

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Interceptor for General User/Customer Authentication (using 'token') ---
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); 
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// =========================================================
// 2. DEDICATED ADMIN AXIOS INSTANCE (adminAxiosInstance)
//    - Uses 'adminToken' key from localStorage
// =========================================================

const adminAxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Interceptor for Admin Authentication (using 'adminToken') ---
adminAxiosInstance.interceptors.request.use(
    (config) => {
        // Retrieve the dedicated admin token
        const adminToken = localStorage.getItem('adminToken'); 
        if (adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// =========================================================
// 3. COMMON RESPONSE INTERCEPTOR (Applied to both instances)
//    - Handles global error cases like 401
// =========================================================

const unauthorizedResponseHandler = (error) => {
    if (error.response && error.response.status === 401) {
        console.error('Unauthorized (401) received. Clearing all auth data.');
        
        // Clear all relevant authentication keys on 401
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole'); // Assuming you store role
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
    }
    return Promise.reject(error);
};

axiosInstance.interceptors.response.use(
    (response) => response,
    unauthorizedResponseHandler
);

adminAxiosInstance.interceptors.response.use(
    (response) => response,
    unauthorizedResponseHandler
);


export default axiosInstance; // General use
export { adminAxiosInstance }; // Admin use