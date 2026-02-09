import axios from 'axios';

/**
 * API base URL desde variables de entorno.
 * Expo requiere EXPO_PUBLIC_ para variables accesibles en el cliente.
 */
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en la petición:', error);
    return Promise.reject(error);
  }
);

export { api, API_URL };
