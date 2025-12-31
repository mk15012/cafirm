'use client';

import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: number;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  colors: [string, string];
}

const slides: Slide[] = [
  {
    id: 1,
    icon: '📊',
    title: 'Practice Management',
    subtitle: 'Simplified',
    description: 'Manage all your clients, firms, and tasks from one centralized dashboard. Say goodbye to spreadsheets!',
    colors: ['#0f172a', '#1e3a5f'],
  },
  {
    id: 2,
    icon: '📋',
    title: 'Track Compliance',
    subtitle: 'Never Miss Deadlines',
    description: 'ITR, GST, TDS, MCA filings - track all compliance deadlines and get timely reminders.',
    colors: ['#1e3a5f', '#0d9488'],
  },
  {
    id: 3,
    icon: '🔒',
    title: 'Secure Credentials',
    subtitle: 'Bank-Grade Security',
    description: 'Store government portal credentials securely with AES-256 encryption. Access them anytime.',
    colors: ['#0d9488', '#7c3aed'],
  },
  {
    id: 4,
    icon: '📱',
    title: 'Work Anywhere',
    subtitle: 'On The Go',
    description: 'Access your practice from anywhere. Assign tasks, track progress, and stay connected with your team.',
    colors: ['#7c3aed', '#0ea5e9'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentSlide(index);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
    router.replace('/auth/login');
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      {/* Slides */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <LinearGradient
            key={slide.id}
            colors={slide.colors}
            style={styles.slide}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <SafeAreaView style={styles.slideContent}>
              {/* Skip Button */}
              <View style={styles.skipContainer}>
                {currentSlide < slides.length - 1 && (
                  <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>Skip</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconBackground}>
                  <Text style={styles.icon}>{slide.icon}</Text>
                </View>
                {/* Decorative circles */}
                <View style={[styles.decorCircle, styles.circle1]} />
                <View style={[styles.decorCircle, styles.circle2]} />
                <View style={[styles.decorCircle, styles.circle3]} />
              </View>

              {/* Content */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>
        ))}
      </Animated.ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity },
                ]}
              />
            );
          })}
        </View>

        {/* Get Started Button - Only on last slide */}
        {currentSlide === slides.length - 1 && (
          <TouchableOpacity style={styles.nextButton} onPress={completeOnboarding}>
            <Text style={styles.nextButtonText}>Get Started</Text>
          </TouchableOpacity>
        )}

        {/* Swipe hint - Only on first slides */}
        {currentSlide < slides.length - 1 && (
          <Text style={styles.swipeHint}>Swipe to continue →</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  slide: {
    width,
    height,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: 32,
  },
  skipContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  icon: {
    fontSize: 72,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  circle1: {
    width: 220,
    height: 220,
  },
  circle2: {
    width: 280,
    height: 280,
  },
  circle3: {
    width: 340,
    height: 340,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 50 : 32,
    paddingTop: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
  },
  nextButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  swipeHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

