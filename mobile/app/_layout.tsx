import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

export default function RootLayout() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="clients" />
      <Stack.Screen name="firms" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="invoices" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="approvals" />
    </Stack>
  );
}
