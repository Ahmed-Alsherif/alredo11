import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { router } from 'expo-router';

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }
  return 'http://localhost:8000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, token ? `Token present: ${token.substring(0, 15)}...` : 'No token found');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log('[API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config?.method?.toUpperCase()} ${response.config?.url} Status: ${response.status}`);
    return response;
  },
  async (error) => {
    console.log(`[API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} Status: ${error.response?.status}`);
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      console.log('[API Auth] 401 detected. Refresh token found:', !!refreshToken);
      if (refreshToken) {
        try {
          console.log('[API Auth] Attempting token refresh...');
          const res = await axios.post(`${getBaseUrl()}/auth/refresh/`, {
            refresh: refreshToken,
          });
          if (res.status === 200) {
            console.log('[API Auth] Token refresh successful!');
            await AsyncStorage.setItem('access_token', res.data.access);
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.log('[API Auth] Token refresh failed, clearing tokens:', refreshError.message);
          await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
          setTimeout(() => {
            router.replace('/login');
          }, 200);
        }
      } else {
        console.log('[API Auth] No refresh token available, clearing tokens');
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        setTimeout(() => {
          router.replace('/login');
        }, 200);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
