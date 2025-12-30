import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  reportsTo?: { id: string; name: string };
  createdAt: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user: currentUser, logout, initializeAuth } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/auth/login');
        return;
      }
      loadProfile();
    }
  }, [isAuthenticated, isLoading]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading profile...');
      // Use /auth/me endpoint which works for any authenticated user
      const response = await api.get('/auth/me');
      console.log('Profile response:', response.data);
      setProfile(response.data);
    } catch (err: any) {
      console.error('Profile load error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load profile';
      setError(errorMsg);
      // If API fails, use cached user data from store
      if (currentUser) {
        setProfile({
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      Alert.alert('Success', 'Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('profile');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = { CA: '#a855f7', MANAGER: '#3b82f6', STAFF: '#6b7280' };
    return colors[role] || '#6b7280';
  };

  if (isLoading || loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) return null;

  // Use profile from API or fallback to store user
  const displayProfile = profile || (currentUser ? {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  } : null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProfile} colors={['#0ea5e9']} />}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={{ width: 60 }} />
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {displayProfile ? (
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayProfile.name.charAt(0).toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.name}>{displayProfile.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(displayProfile.role) + '20', borderColor: getRoleColor(displayProfile.role) }]}>
              <Text style={[styles.roleText, { color: getRoleColor(displayProfile.role) }]}>{displayProfile.role}</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
                onPress={() => setActiveTab('profile')}
              >
                <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'password' && styles.tabActive]}
                onPress={() => setActiveTab('password')}
              >
                <Text style={[styles.tabText, activeTab === 'password' && styles.tabTextActive]}>Password</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'profile' && (
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📧 Email</Text>
                  <Text style={styles.infoValue}>{displayProfile.email}</Text>
                </View>
                {displayProfile.phone && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>📱 Phone</Text>
                    <Text style={styles.infoValue}>{displayProfile.phone}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🔒 Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: displayProfile.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6' }]}>
                    <Text style={[styles.statusText, { color: displayProfile.status === 'ACTIVE' ? '#059669' : '#6b7280' }]}>{displayProfile.status}</Text>
                  </View>
                </View>
                {displayProfile.reportsTo && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>👤 Reports To</Text>
                    <Text style={styles.infoValue}>{displayProfile.reportsTo.name}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📅 Member Since</Text>
                  <Text style={styles.infoValue}>{formatDate(displayProfile.createdAt)}</Text>
                </View>
              </View>
            )}

            {activeTab === 'password' && (
              <View style={styles.passwordSection}>
                <Text style={styles.passwordTitle}>🔐 Change Password</Text>
                <Text style={styles.passwordSubtitle}>Update your account password</Text>
                
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor="#9ca3af"
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                  secureTextEntry
                />
                
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password (min. 6 chars)"
                  placeholderTextColor="#9ca3af"
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                  secureTextEntry
                />
                
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                  secureTextEntry
                />
                
                <TouchableOpacity
                  style={[styles.changePasswordButton, changingPassword && styles.buttonDisabled]}
                  onPress={handlePasswordChange}
                  disabled={changingPassword}
                >
                  <Text style={styles.changePasswordButtonText}>
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noProfileCard}>
            <Text style={styles.noProfileText}>Unable to load profile</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
  container: { flex: 1 },
  header: { backgroundColor: '#0f172a', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { color: '#0ea5e9', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  errorBanner: { backgroundColor: '#fef2f2', padding: 12, margin: 16, marginBottom: 0, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#dc2626', fontSize: 14 },
  profileCard: { backgroundColor: 'white', margin: 16, padding: 24, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  avatarContainer: { marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: 'white' },
  name: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  roleText: { fontSize: 14, fontWeight: '600' },
  tabs: { flexDirection: 'row', width: '100%', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#0ea5e9' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  tabTextActive: { color: '#0ea5e9', fontWeight: '600' },
  infoSection: { width: '100%' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#0f172a', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  passwordSection: { width: '100%' },
  passwordTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  passwordSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16, color: '#0f172a' },
  changePasswordButton: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  changePasswordButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  noProfileCard: { backgroundColor: 'white', margin: 16, padding: 32, borderRadius: 16, alignItems: 'center' },
  noProfileText: { fontSize: 16, color: '#64748b', marginBottom: 16 },
  retryButton: { backgroundColor: '#0ea5e9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  logoutButton: { backgroundColor: '#ef4444', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
