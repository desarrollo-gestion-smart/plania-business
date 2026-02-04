export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  token?: string;
  businessId?: number | string;
  isInitialSetupComplete?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  nombre: string;
  correo: string;
  numero: string;
  password: string;
  terms: boolean;
}

export interface ResetPasswordCredentials {
  email: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (credentials: ResetPasswordCredentials) => Promise<void>;
}