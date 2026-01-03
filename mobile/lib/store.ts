import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CA' | 'MANAGER' | 'STAFF' | 'INDIVIDUAL';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string, role?: 'CA' | 'INDIVIDUAL') => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User, token: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  
  signup: async (name: string, email: string, password: string, phone?: string, role?: 'CA' | 'INDIVIDUAL') => {
    const response = await api.post('/auth/signup', { name, email, password, phone, role: role || 'CA' });
    const { token, user } = response.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  
  setUser: async (user: User, token: string) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  initializeAuth: async () => {
    const token = await AsyncStorage.getItem('token');
    const userStr = await AsyncStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const response = await api.get('/auth/me');
        if (response.data) {
          const userData = response.data;
          set({ user: userData, token, isAuthenticated: true, isLoading: false });
        } else {
          throw new Error('Token invalid');
        }
      } catch (error: any) {
        console.error('Auth initialization failed:', error.response?.data || error.message);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
