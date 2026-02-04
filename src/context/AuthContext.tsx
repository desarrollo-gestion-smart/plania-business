import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email?: string;
  phone?: string;
  token: string;
  businessId?: string;
  isInitialSetupComplete?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar el usuario del almacenamiento al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsed = JSON.parse(userData);
          const normalizedUser = {
            ...parsed,
            isInitialSetupComplete: Boolean(
              parsed?.isInitialSetupComplete === true ||
              parsed?.isInitialSetupComplete === 'true' ||
              parsed?.isInitialSetupComplete === 1 ||
              parsed?.isInitialSetupComplete === '1'
            )
          } as User;
          setUser(normalizedUser);
        }
      } catch (error) {
        console.error('Error al cargar el usuario:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (userData: User) => {
    try {
      const normalizedUser: User = {
        ...userData,
        isInitialSetupComplete: Boolean(
          (userData as any)?.isInitialSetupComplete === true ||
          (userData as any)?.isInitialSetupComplete === 'true' ||
          (userData as any)?.isInitialSetupComplete === 1 ||
          (userData as any)?.isInitialSetupComplete === '1'
        )
      };
      await AsyncStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser: User = {
        ...user,
        ...userData,
      };
      updatedUser.isInitialSetupComplete = Boolean(
        (updatedUser as any)?.isInitialSetupComplete === true ||
        (updatedUser as any)?.isInitialSetupComplete === 'true' ||
        (updatedUser as any)?.isInitialSetupComplete === 1 ||
        (updatedUser as any)?.isInitialSetupComplete === '1'
      );
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
