import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/lib/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RootLayout() {
  const { initializeAuth, isAuthenticated, isLoading, token } = useAuthStore();
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Check onboarding status and initialize auth on app start
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
        setHasSeenOnboarding(onboardingCompleted === 'true');
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setHasSeenOnboarding(true); // Default to true on error
      }
    };
    checkOnboarding();
    initializeAuth();
  }, []);

  // Mark layout as ready after first render
  useEffect(() => {
    setIsLayoutReady(true);
  }, []);

  // Handle navigation based on auth and onboarding state
  useEffect(() => {
    if (!isLayoutReady || isLoading || hasSeenOnboarding === null) return;

    const checkAndNavigate = async () => {
      const firstSegment = segments[0] as string | undefined;
      const inAuthGroup = firstSegment === 'auth';
      const inOnboarding = firstSegment === 'onboarding';
      const inIndexPage = !firstSegment || firstSegment === 'index';

      // Re-check AsyncStorage to get the latest onboarding status
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
      const currentOnboardingStatus = onboardingCompleted === 'true';

      // Update state if it changed
      if (currentOnboardingStatus !== hasSeenOnboarding) {
        setHasSeenOnboarding(currentOnboardingStatus);
        return; // Let the next effect run handle navigation
      }

      // If user hasn't seen onboarding and not currently on onboarding page
      if (!currentOnboardingStatus && !inOnboarding) {
        router.replace('/onboarding');
        return;
      }

      // Normal auth-based navigation
      if (!isAuthenticated && !inAuthGroup && !inOnboarding && !inIndexPage) {
        router.replace('/auth/login');
      } else if (isAuthenticated && inAuthGroup) {
        router.replace('/dashboard');
      }
    };

    checkAndNavigate();
  }, [isAuthenticated, isLoading, isLayoutReady, segments, token, hasSeenOnboarding]);

  // Show loading screen while initializing
  if (isLoading || hasSeenOnboarding === null) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="office-building" size={40} color="#ffffff" />
          </View>
          <Text style={styles.loadingTitle}>CA Firm Pro</Text>
          <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 24 }} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
});
