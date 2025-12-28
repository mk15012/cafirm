import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User, token: string) => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    await AsyncStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  setUser: async (user: User, token: string) => {
    await AsyncStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  loadStoredAuth: async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        set({ user: response.data, token, isAuthenticated: true });
      } catch (error) {
        await AsyncStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },
}));

