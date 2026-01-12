import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import api from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoginMethod = 'email' | 'otp';
type OtpStep = 'phone' | 'verify' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const { login, setUser } = useAuthStore();

  // Login method toggle
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP login state
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [firebaseToken, setFirebaseToken] = useState('');

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'CA' | 'INDIVIDUAL'>('CA');

  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const otpInputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Email login handler
  const handleEmailLogin = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Invalid credentials';
      setError(message);
      // Also try Alert for native devices
      if (Platform.OS !== 'web') {
        Alert.alert('Login Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP handlers
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    // Always add +91 since user enters 10-digit number only
    return `+91${cleaned}`;
  };

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const confirmationResult = await auth().signInWithPhoneNumber(formattedPhone);
      setConfirmation(confirmationResult);
      setOtpStep('verify');
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

  const handleVerifyOTP = async () => {
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

      try {
        const response = await api.post('/auth/phone/login', { firebaseToken: idToken });
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user, response.data.token);
        router.replace('/(tabs)');
      } catch (apiError: any) {
        if (apiError.response?.status === 404 && apiError.response?.data?.needsRegistration) {
          setFirebaseToken(idToken);
          setOtpStep('register');
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

  const handleRegister = async () => {
    if (!regName.trim() || !regEmail.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/phone/register', {
        firebaseToken,
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        role: regRole,
      });

      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user, response.data.token);
      Alert.alert('Welcome!', 'Your account has been created successfully.');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const resetOtpFlow = () => {
    setOtpStep('phone');
    setOtp(['', '', '', '', '', '']);
    setConfirmation(null);
    setFirebaseToken('');
    setRegName('');
    setRegEmail('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="office-building" size={32} color="#ffffff" />
            </View>
            <Text style={styles.title}>CA Firm Pro</Text>
            <Text style={styles.subtitle}>Login to continue</Text>
          </View>

          {/* Form Card */}
          <View style={styles.form}>
            {/* Login Method Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, loginMethod === 'email' && styles.toggleButtonActive]}
                onPress={() => { setLoginMethod('email'); resetOtpFlow(); }}
              >
                <MaterialCommunityIcons 
                  name="email-outline" 
                  size={18} 
                  color={loginMethod === 'email' ? '#0ea5e9' : '#64748b'} 
                />
                <Text style={[styles.toggleText, loginMethod === 'email' && styles.toggleTextActive]}>
                  Email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, loginMethod === 'otp' && styles.toggleButtonActive]}
                onPress={() => { setLoginMethod('otp'); resetOtpFlow(); }}
              >
                <MaterialCommunityIcons 
                  name="cellphone" 
                  size={18} 
                  color={loginMethod === 'otp' ? '#0ea5e9' : '#64748b'} 
                />
                <Text style={[styles.toggleText, loginMethod === 'otp' && styles.toggleTextActive]}>
                  OTP
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email Login Form */}
            {loginMethod === 'email' && (
              <>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={(text) => { setEmail(text); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={(text) => { setPassword(text); setError(''); }}
                  secureTextEntry
                  autoComplete="password"
                />

                {/* Error Message Display */}
                {error ? (
                  <View style={styles.errorBox}>
                    <MaterialCommunityIcons name="alert-circle" size={18} color="#dc2626" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleEmailLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Login</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => router.push('/auth/forgot-password')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                </TouchableOpacity>
              </>
            )}

            {/* OTP Login Form */}
            {loginMethod === 'otp' && (
              <>
                {/* Phone Input Step */}
                {otpStep === 'phone' && (
                  <>
                    <Text style={styles.inputLabel}>Mobile Number</Text>
                    <View style={styles.phoneInputContainer}>
                      <View style={styles.countryCode}>
                        <Text style={styles.countryCodeText}>+91</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="Mobile number"
                        placeholderTextColor="#9ca3af"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.button, (loading || phoneNumber.length < 10) && styles.buttonDisabled]}
                      onPress={handleSendOTP}
                      disabled={loading || phoneNumber.length < 10}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <View style={styles.buttonContent}>
                          <MaterialCommunityIcons name="cellphone-message" size={20} color="#fff" />
                          <Text style={styles.buttonText}>Send OTP</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* OTP Verify Step */}
                {otpStep === 'verify' && (
                  <>
                    <Text style={styles.otpTitle}>Enter OTP</Text>
                    <Text style={styles.otpSubtitle}>
                      Sent to +91 {phoneNumber}
                    </Text>
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
                      style={[styles.button, (loading || otp.join('').length !== 6) && styles.buttonDisabled]}
                      onPress={handleVerifyOTP}
                      disabled={loading || otp.join('').length !== 6}
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
                        <TouchableOpacity onPress={handleSendOTP}>
                          <Text style={styles.resendText}>Resend OTP</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity onPress={resetOtpFlow}>
                      <Text style={styles.changeNumberText}>← Change Number</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Registration Step */}
                {otpStep === 'register' && (
                  <>
                    <Text style={styles.otpTitle}>Complete Registration</Text>
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your name"
                      placeholderTextColor="#9ca3af"
                      value={regName}
                      onChangeText={setRegName}
                    />
                    <Text style={styles.inputLabel}>Email Address *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={regEmail}
                      onChangeText={setRegEmail}
                    />
                    <Text style={styles.inputLabel}>Account Type *</Text>
                    <View style={styles.roleContainer}>
                      <TouchableOpacity
                        style={[styles.roleButton, regRole === 'CA' && styles.roleButtonActive]}
                        onPress={() => setRegRole('CA')}
                      >
                        <Text style={[styles.roleButtonText, regRole === 'CA' && styles.roleButtonTextActive]}>
                          CA / Firm
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.roleButton, regRole === 'INDIVIDUAL' && styles.roleButtonActive]}
                        onPress={() => setRegRole('INDIVIDUAL')}
                      >
                        <Text style={[styles.roleButtonText, regRole === 'INDIVIDUAL' && styles.roleButtonTextActive]}>
                          Individual
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={handleRegister}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Create Account</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* Sign Up Link */}
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.replace('/auth/signup')}
            >
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 8,
  },
  form: {
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#1e293b',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#0ea5e9',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  countryCode: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  countryCodeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 18,
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: '#475569',
  },
  button: {
    backgroundColor: '#0ea5e9',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#94a3b8',
    fontSize: 15,
  },
  linkTextBold: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    flex: 1,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: '#334155',
    borderRadius: 12,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#475569',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
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
  changeNumberText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleButtonActive: {
    borderColor: '#0ea5e9',
    backgroundColor: '#0ea5e920',
  },
  roleButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#0ea5e9',
  },
});
