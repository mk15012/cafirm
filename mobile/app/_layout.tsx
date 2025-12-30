import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/lib/store';

export default function RootLayout() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
