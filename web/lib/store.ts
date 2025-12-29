import { create } from 'zustand';
import api from './api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CA' | 'MANAGER' | 'STAFF';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  
  signup: async (name: string, email: string, password: string, phone?: string) => {
    const response = await api.post('/auth/signup', { name, email, password, phone });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  
  setUser: (user: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  initializeAuth: async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        // Verify token is still valid by making API call with stored token
        // Use the api instance which will automatically add the token
        const response = await api.get('/auth/me');
        
        if (response.data) {
          const userData = response.data;
          set({ user: userData, token, isAuthenticated: true, isLoading: false });
        } else {
          throw new Error('Token invalid');
        }
      } catch (error: any) {
        console.error('Auth initialization failed:', error.response?.data || error.message);
        // Token invalid, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));

