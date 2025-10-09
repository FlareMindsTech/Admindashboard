import axios from 'axios';

const API_BASE_URL = 'https://boutique-ecommerce-1.onrender.com'; 

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
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