import { useState } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/lib/api';

type Step = 'email' | 'code' | 'success';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devResetCode, setDevResetCode] = useState(''); // For showing code in dev mode

  const handleRequestCode = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setError('');
    setDevResetCode('');
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      // In development, show the code
      if (response.data.resetCode) {
        setDevResetCode(response.data.resetCode);
        setStep('code');
      } else {
        setStep('code');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        resetCode,
        newPassword,
      });
      
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
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
              <MaterialCommunityIcons name="lock-reset" size={32} color="#ffffff" />
            </View>
            <Text style={styles.title}>
              {step === 'email' ? 'Forgot Password?' : step === 'code' ? 'Reset Password' : 'Success!'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'email' 
                ? 'Enter your email to receive a reset code' 
                : step === 'code' 
                ? `Enter the code sent to ${email}`
                : 'Your password has been reset'}
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.form}>
            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Dev Reset Code Display */}
            {devResetCode && step === 'code' ? (
              <View style={styles.devCodeContainer}>
                <Text style={styles.devCodeLabel}>Dev Mode - Reset Code:</Text>
                <Text style={styles.devCodeText}>{devResetCode}</Text>
              </View>
            ) : null}

            {step === 'email' && (
              <>
                <Text style={styles.inputLabel}>Email Address</Text>
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
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleRequestCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send Reset Code</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'code' && (
              <>
                <Text style={styles.inputLabel}>Reset Code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#9ca3af"
                  value={resetCode}
                  onChangeText={(text) => { setResetCode(text); setError(''); }}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => setStep('email')}
                >
                  <Text style={styles.linkText}>← Use different email</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'success' && (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <MaterialCommunityIcons name="check-circle" size={64} color="#22c55e" />
                </View>
                <Text style={styles.successText}>
                  Your password has been reset successfully. You can now login with your new password.
                </Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => router.replace('/auth/login')}
                >
                  <Text style={styles.buttonText}>Go to Login</Text>
                </TouchableOpacity>
              </View>
            )}

            {step !== 'success' && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => router.replace('/auth/login')}
              >
                <Text style={styles.linkText}>
                  ← Back to Login
                </Text>
              </TouchableOpacity>
            )}
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
    fontSize: 14,
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 16,
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
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#94a3b8',
    fontSize: 15,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  successText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  devCodeContainer: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  devCodeLabel: {
    color: '#16a34a',
    fontSize: 12,
    marginBottom: 4,
  },
  devCodeText: {
    color: '#15803d',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
  },
});

