import axios from 'axios';

// --- Configuration ---
// IMPORTANT: Replace this with your actual backend API URL.
// Ensure it points to the route prefix before your specific endpoints (e.g., /products, /categories).
const API_BASE_URL = 'http://localhost:7000'; 
// If your backend routes are prefixed with '/api', use:
// const API_BASE_URL = 'http://localhost:7000/api'; 
// Use the URL that precedes '/products/all' or '/categories/all'.

// Create a custom Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Timeout requests after 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptor to Inject JWT Token ---
// This request interceptor runs before every request is sent.
axiosInstance.interceptors.request.use(
  (config) => {
    // 1. Get the JWT token from local storage
    const token = localStorage.getItem('token');

    // 2. If the token exists, attach it to the Authorization header
    if (token) {
      // Standard format for JWT authentication
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Handle request errors (e.g., network issues)
    return Promise.reject(error);
  }
);

// --- Optional: Interceptor to Handle 401 Unauthorized Responses ---
// This response interceptor can automatically log out users whose token has expired
axiosInstance.interceptors.response.use(
  (response) => {
    // If the request was successful, just return the response
    return response;
  },
  (error) => {
    // Check if the response error is 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized (401) received. Token may be expired or invalid.');
      
      // Clear token and user data from local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect the user to the login page (or another appropriate action)
      // Note: You can't use 'navigate' hook here, so you must use a standard window redirect.
      // window.location.href = '/auth/signin';
      
      // You can add a global toast/notification here if needed, but the frontend's
      // useEffect already handles the redirection upon the *next* reload/page load.
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;