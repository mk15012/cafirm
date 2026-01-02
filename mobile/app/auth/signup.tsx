import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type UserType = 'professional' | 'individual' | null;

export default function SignupScreen() {
  const [userType, setUserType] = useState<UserType>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuthStore();
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Name, email, and password are required');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password, phone || undefined, userType === 'individual' ? 'INDIVIDUAL' : 'CA');
      router.replace('/dashboard');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.response?.data?.error || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  // User Type Selection Screen
  if (!userType) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="office-building" size={32} color="#ffffff" />
            </View>
            <Text style={styles.title}>CA Firm Pro</Text>
            <Text style={styles.subtitle}>How will you use this app?</Text>
          </View>

          <View style={styles.typeSelectionContainer}>
            {/* Professional Option */}
            <TouchableOpacity 
              style={styles.typeCard}
              onPress={() => setUserType('professional')}
              activeOpacity={0.8}
            >
              <View style={[styles.typeIconContainer, { backgroundColor: '#0ea5e9' }]}>
                <MaterialCommunityIcons name="briefcase" size={28} color="#ffffff" />
              </View>
              <View style={styles.typeContent}>
                <Text style={styles.typeTitle}>CA / Tax Professional</Text>
                <Text style={styles.typeDescription}>
                  I manage clients, team members, and need invoicing & compliance tools
                </Text>
                <View style={styles.tagContainer}>
                  <View style={[styles.tag, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
                    <Text style={[styles.tagText, { color: '#38bdf8' }]}>Client Management</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
                    <Text style={[styles.tagText, { color: '#38bdf8' }]}>Team</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
                    <Text style={[styles.tagText, { color: '#38bdf8' }]}>Invoicing</Text>
                  </View>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
            </TouchableOpacity>

            {/* Individual Option */}
            <TouchableOpacity 
              style={styles.typeCard}
              onPress={() => setUserType('individual')}
              activeOpacity={0.8}
            >
              <View style={[styles.typeIconContainer, { backgroundColor: '#10b981' }]}>
                <MaterialCommunityIcons name="account" size={28} color="#ffffff" />
              </View>
              <View style={styles.typeContent}>
                <Text style={styles.typeTitle}>Individual / Personal Use</Text>
                <Text style={styles.typeDescription}>
                  I file my own taxes and want to store passwords & organize documents
                </Text>
                <View style={styles.tagContainer}>
                  <View style={[styles.tag, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Text style={[styles.tagText, { color: '#34d399' }]}>Password Storage</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Text style={[styles.tagText, { color: '#34d399' }]}>Tax Calculator</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <Text style={[styles.tagText, { color: '#f87171' }]}>❤️ Free Forever</Text>
                  </View>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Login</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Signup Form Screen
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setUserType(null)}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#94a3b8" />
              <Text style={styles.backText}>Change account type</Text>
            </TouchableOpacity>
            
            <View style={[
              styles.accountTypeBadge,
              { backgroundColor: userType === 'individual' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(14, 165, 233, 0.2)' }
            ]}>
              <MaterialCommunityIcons 
                name={userType === 'individual' ? 'account' : 'briefcase'} 
                size={16} 
                color={userType === 'individual' ? '#34d399' : '#38bdf8'} 
              />
              <Text style={[
                styles.accountTypeText,
                { color: userType === 'individual' ? '#34d399' : '#38bdf8' }
              ]}>
                {userType === 'individual' ? 'Personal Account' : 'Professional Account'}
              </Text>
            </View>
            
            <View style={[
              styles.logoContainer,
              { backgroundColor: userType === 'individual' ? '#10b981' : '#0ea5e9' }
            ]}>
              <MaterialCommunityIcons name="office-building" size={32} color="#ffffff" />
            </View>
            <Text style={styles.title}>CA Firm Pro</Text>
            <Text style={styles.subtitle}>
              {userType === 'individual' 
                ? 'Start organizing your personal tax documents' 
                : 'Create your professional account'}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Text style={styles.inputLabel}>Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password (min. 6 chars)"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[
                styles.button, 
                loading && styles.buttonDisabled,
                { backgroundColor: userType === 'individual' ? '#10b981' : '#0ea5e9' }
              ]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Sign Up'}</Text>
            </TouchableOpacity>
            
            {userType === 'individual' && (
              <Text style={styles.freeText}>❤️ Free forever for personal use</Text>
            )}
            
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.replace('/auth/login')}
            >
              <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Login</Text></Text>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  accountTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  accountTypeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
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
  typeSelectionContainer: {
    gap: 16,
  },
  typeCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeContent: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
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
  freeText: {
    textAlign: 'center',
    color: '#f87171',
    fontSize: 13,
    marginTop: 12,
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
});
