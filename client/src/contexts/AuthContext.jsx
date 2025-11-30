import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import apiClient from '../services/api';
import { toast } from '../components/common/Toaster';

const authChannel = new BroadcastChannel('auth_channel');
const AuthContext = createContext(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const currentToken = localStorage.getItem('accessToken');
      if (currentToken) {
        try {
          const decodedToken = jwtDecode(currentToken);
          if (decodedToken.exp * 1000 < Date.now()) {
            throw new Error("Token expired");
          }
          // Set token for apiClient before making the request
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
          const response = await apiClient.get('/api/users/me');
          setUser(response.data);
        } catch (error) {
          console.error("Auth initialization failed:", error);
          logout(false);
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  useEffect(() => {
    const handleAuthMessage = (event) => {
      if (event.data.type === 'LOGOUT') {
        setUser(null);
        setToken(null);
        delete apiClient.defaults.headers.common['Authorization'];
      }
      if (event.data.type === 'LOGIN') {
        const newToken = event.data.token;
        localStorage.setItem('accessToken', newToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        apiClient.get('/api/users/me').then(response => setUser(response.data));
      }
    };
    authChannel.addEventListener('message', handleAuthMessage);
    return () => {
      authChannel.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  const login = async (email, password) => {
    // --- THIS IS THE FIX ---
    // The API URL should be consistent, ideally from an env variable.
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    
    try {
      // 1. Send a standard JSON payload instead of form-data.
      // 2. The endpoint in the new Node backend is just /api/login.
      const response = await axios.post(`${API_URL}/api/login`, {
        email, // The key is 'email', not 'username'
        password,
      });

      const newAccessToken = response.data.access_token;
      localStorage.setItem('accessToken', newAccessToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      
      const userResponse = await apiClient.get('/api/users/me');
      setUser(userResponse.data);
      setToken(newAccessToken);
      
      authChannel.postMessage({ type: 'LOGIN', token: newAccessToken });
      return true;
    } catch (error) {
      // Use the 'message' field from the Node.js error handler
      const errorMessage = error.response?.data?.message || 'Invalid email or password';
      toast.error(errorMessage);
      return false;
    }
    // ----------------------
  };

  const logout = (broadcast = true) => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('accessToken');
    delete apiClient.defaults.headers.common['Authorization'];
    if (broadcast) {
      authChannel.postMessage({ type: 'LOGOUT' });
    }
  };

  const getToken = () => token;

  return (
    <AuthContext.Provider value={{ user, currentRole: user?.role || null, login, logout, isLoading, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};