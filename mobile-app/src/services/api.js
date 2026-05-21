import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 💡 EMULATOR NOTE:
// iOS emulator uses '127.0.0.1:4000' or 'localhost:4000' for local testing.
// Android emulator uses '10.0.2.2:4000' to reach the local backend machine.
// Live Production URL: 'https://safarsetu-backend-production-cd62.up.railway.app'

const BASE_URL = 'https://safarsetu-backend-production-cd62.up.railway.app';
// const BASE_URL = 'http://10.0.2.2:4000'; // Uncomment for Android Emulator local testing
// const BASE_URL = 'http://localhost:4000';  // Uncomment for iOS Emulator local testing

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic request interceptor to append JWT Bearer Token
api.interceptors.request.use(
  async (config) => {
    try {
      const authData = await AsyncStorage.getItem('authUser');
      if (authData) {
        const { token } = JSON.parse(authData);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('API Interceptor: Error reading token', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
