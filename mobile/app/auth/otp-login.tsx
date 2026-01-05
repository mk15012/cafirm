import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OTPLoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  
  // Registration fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'CA' | 'INDIVIDUAL'>('CA');
  const [firebaseToken, setFirebaseToken] = useState('');

  const otpInputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Always add +91 since user enters 10-digit number only
    return `+91${cleaned}`;
  };

  const sendOTP = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('Sending OTP to:', formattedPhone);
      
      const confirmationResult = await auth().signInWithPhoneNumber(formattedPhone);
      setConfirmation(confirmationResult);
      setStep('otp');
      setCountdown(60);
      Alert.alert('OTP Sent', `OTP has been sent to ${formattedPhone}`);
    } catch (error: any) {
      console.error('OTP send error:', error);
      let message = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/invalid-phone-number') {
        message = 'Invalid phone number format';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      }
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    if (!confirmation) {
      Alert.alert('Error', 'Please request OTP first');
      return;
    }

    setLoading(true);
    try {
      const credential = await confirmation.confirm(otpCode);
      if (!credential || !credential.user) {
        throw new Error('Failed to verify OTP');
      }
      const idToken = await credential.user.getIdToken();
      
      // Try to login with our backend
      try {
        const response = await api.post('/auth/phone/login', {
          firebaseToken: idToken,
        });

        // Success - user exists
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user, response.data.token);
        
        router.replace('/(tabs)');
      } catch (apiError: any) {
        if (apiError.response?.status === 404 && apiError.response?.data?.needsRegistration) {
          // User needs to register
          setFirebaseToken(idToken);
          setStep('register');
        } else {
          throw apiError;
        }
      }
    } catch (error: any) {
      console.error('OTP verify error:', error);
      let message = 'Invalid OTP. Please try again.';
      if (error.code === 'auth/invalid-verification-code') {
        message = 'Invalid OTP code. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        message = 'OTP has expired. Please request a new one.';
      }
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/phone/register', {
        firebaseToken,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      });

      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user, response.data.token);
      
      Alert.alert('Welcome!', 'Your account has been created successfully.');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const resendOTP = () => {
    setOtp(['', '', '', '', '', '']);
    sendOTP();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>CA Firm Pro</Text>
            <Text style={styles.title}>
              {step === 'phone' && 'Login with OTP'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'register' && 'Complete Registration'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone' && 'Enter your mobile number to receive OTP'}
              {step === 'otp' && `Enter the 6-digit code sent to +91 ${phoneNumber}`}
              {step === 'register' && 'Just a few more details to get started'}
            </Text>
          </View>

          {/* Phone Input Step */}
          {step === 'phone' && (
            <View style={styles.form}>
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Mobile Number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={sendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => router.push('/auth/login')}
              >
                <Text style={styles.linkText}>Login with Email & Password instead</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Input Step */}
          {step === 'otp' && (
            <View style={styles.form}>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputs.current[index] = ref)}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={verifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>Resend OTP in {countdown}s</Text>
                ) : (
                  <TouchableOpacity onPress={resendOTP}>
                    <Text style={styles.resendText}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setStep('phone')}
              >
                <Text style={styles.linkText}>← Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Registration Step */}
          {step === 'register' && (
            <View style={styles.form}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.inputLabel}>Account Type *</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'CA' && styles.roleButtonActive]}
                  onPress={() => setRole('CA')}
                >
                  <Text style={[styles.roleButtonText, role === 'CA' && styles.roleButtonTextActive]}>
                    CA / Firm
                  </Text>
                  <Text style={styles.roleDescription}>
                    For Chartered Accountants managing clients
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleButton, role === 'INDIVIDUAL' && styles.roleButtonActive]}
                  onPress={() => setRole('INDIVIDUAL')}
                >
                  <Text style={[styles.roleButtonText, role === 'INDIVIDUAL' && styles.roleButtonTextActive]}>
                    Individual
                  </Text>
                  <Text style={styles.roleDescription}>
                    For personal tax management
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={registerUser}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 40,
    marginTop: 40,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0ea5e9',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  countryCode: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
  },
  countryCodeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 18,
    letterSpacing: 2,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    color: '#0ea5e9',
    fontSize: 14,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownText: {
    color: '#64748b',
    fontSize: 14,
  },
  resendText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 20,
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleButton: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleButtonActive: {
    borderColor: '#0ea5e9',
    backgroundColor: '#0ea5e920',
  },
  roleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleButtonTextActive: {
    color: '#0ea5e9',
  },
  roleDescription: {
    color: '#64748b',
    fontSize: 12,
  },
});

