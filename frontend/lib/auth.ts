import api from './api';
import { AuthResponse, LoginCredentials, SignupCredentials } from '@/types';

export const authService = {
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/Signup', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/Login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/Logout');
    } finally {
      localStorage.removeItem('token');
    }
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
