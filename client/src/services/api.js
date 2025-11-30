// in src/services/api.js (or apiClient.js)

import axios from 'axios';
import { toast } from '../components/common/Toaster'; // Or wherever your toaster is

// Use environment variables for the API URL for flexibility
const API_URL =   'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- THIS IS THE CRITICAL FIX ---
// This block runs ONCE when the module is first loaded.
// It sets the authorization header for all subsequent requests if a token exists.
const token = localStorage.getItem('accessToken');
if (token) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
// ------------------------------
apiClient.defaults.headers.get['Cache-Control'] = 'no-cache';
apiClient.defaults.headers.get['Pragma'] = 'no-cache';
apiClient.defaults.headers.get['Expires'] = '0';

// Optional but recommended: Add an interceptor to handle 401 errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // This means the token is invalid or expired.
      // We can automatically log the user out.
      toast.error('Session expired. Please log in again.');
      localStorage.removeItem('accessToken');
      // This will force a reload to the login page
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default apiClient;