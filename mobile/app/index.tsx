import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeAuth().then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  const handleContinue = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>📊</Text>
      <Text style={styles.title}>CA Firm Management</Text>
      <Text style={styles.subtitle}>Chartered Accountant Practice Management</Text>
      
      {!ready || isLoading ? (
        <>
          <ActivityIndicator size="large" color="#0ea5e9" style={styles.spinner} />
          <Text style={styles.loadingText}>Loading...</Text>
        </>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>
            {isAuthenticated ? 'Go to Dashboard' : 'Login / Sign Up'}
          </Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.version}>v1.0.0 • Expo SDK 52</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  logo: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 48,
    textAlign: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  button: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: '#64748b',
  },
});
