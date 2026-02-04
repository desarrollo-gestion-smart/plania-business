import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, AuthState, LoginCredentials, RegisterCredentials, ResetPasswordCredentials } from '../types/auth';
import { login as loginService, register as registerService, logout as logoutService, resetPassword as resetPasswordService } from '../services/authService';

export const useAuth = (): AuthContextType => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          const userNormalized = {
            ...user,
            isInitialSetupComplete: Boolean(
              user?.isInitialSetupComplete === true ||
              user?.isInitialSetupComplete === 'true' ||
              user?.isInitialSetupComplete === 1 ||
              user?.isInitialSetupComplete === '1'
            )
          };
          setState({ isAuthenticated: true, user: userNormalized, loading: false, error: null });
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        setState(prev => ({ ...prev, loading: false, error: 'Failed to load auth state' }));
      }
    };
    loadAuthState();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await loginService(credentials);
      const userNormalized = {
        ...response.user,
        isInitialSetupComplete: Boolean(
          (response?.user as any)?.isInitialSetupComplete === true ||
          (response?.user as any)?.isInitialSetupComplete === 'true' ||
          (response?.user as any)?.isInitialSetupComplete === 1 ||
          (response?.user as any)?.isInitialSetupComplete === '1'
        )
      };
      await AsyncStorage.setItem('user', JSON.stringify(userNormalized));
      await AsyncStorage.setItem('token', response.token);
      setState({ isAuthenticated: true, user: userNormalized, loading: false, error: null });
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Login failed' }));
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const user = await registerService(credentials);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setState({ isAuthenticated: true, user, loading: false, error: null });
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Registration failed' }));
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await logoutService();
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setState({ isAuthenticated: false, user: null, loading: false, error: null });
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Logout failed' }));
    }
  };

  const resetPassword = async (credentials: ResetPasswordCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await resetPasswordService(credentials);
      setState(prev => ({ ...prev, loading: false, error: null }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Reset password failed' }));
    }
  };

  return {
    ...state,
    login,
    register,
    logout,
    resetPassword,
  };
};