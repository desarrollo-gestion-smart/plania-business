import { User, LoginResponse, LoginCredentials, RegisterCredentials, ResetPasswordCredentials } from '../types/auth';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  await delay(1000); // Simulate API call
  // Mock successful login
  return {
    user: {
      id: '1',
      email: credentials.email,
      name: 'Mock User',
    },
    token: 'mock-jwt-token-12345',
  };
};

export const register = async (credentials: RegisterCredentials): Promise<User> => {
  try {
    const response = await fetch(`${API_URL}/register-business`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: credentials.nombre,
        correo: credentials.correo,
        numero: credentials.numero,
        password: credentials.password,
        terms: credentials.terms
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en el registro');
    }

    const data = await response.json();
    
    // Ajusta esto según la respuesta real de tu API
    return {
      id: data.id || '1',
      email: data.correo || credentials.correo,
      name: data.nombre || credentials.nombre,
    };
  } catch (error) {
    console.error('Error en el registro:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  await delay(500); // Simulate API call
  // Mock logout
};

export const resetPassword = async (credentials: ResetPasswordCredentials): Promise<void> => {
  await delay(1000); // Simulate API call
  // Mock password reset
};