import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  birthday?: string;
  role: string;
  status: string;
  reportsTo?: { id: string; name: string };
  createdAt: string;
}

interface SubscriptionData {
  subscription: {
    plan: string;
    planName: string;
    status: string;
  };
  usage: {
    clients: { used: number; limit: number };
    users: { used: number; limit: number };
  };
}

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, user: currentUser, logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'password'>('profile');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    birthday: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
      if (currentUser?.role === 'CA') {
        loadSubscription();
      }
    }
  }, [isAuthenticated]);

  const loadSubscription = async () => {
    try {
      const response = await api.get('/subscription/my');
      setSubscription(response.data);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading profile...');
      // Use /auth/me endpoint which works for any authenticated user
      const response = await api.get('/auth/me');
      console.log('Profile response:', response.data);
      setProfile(response.data);
      // Initialize edit data with DD-MM-YYYY format for birthday
      const birthdayISO = response.data.birthday ? response.data.birthday.split('T')[0] : '';
      setEditData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        birthday: birthdayISO ? formatDateDDMMYYYY(birthdayISO) : '',
      });
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
        setEditData({
          name: currentUser.name,
          phone: '',
          birthday: '',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      setSavingProfile(true);
      // Convert birthday from DD-MM-YYYY to YYYY-MM-DD for API
      const profileData = {
        ...editData,
        birthday: convertToISODate(editData.birthday),
      };
      const response = await api.put('/auth/profile', profileData);
      setProfile(response.data);
      Alert.alert('Success', 'Profile updated successfully!');
      setActiveTab('profile');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const [loggingOut, setLoggingOut] = useState(false);

  const doLogout = async () => {
    setLoggingOut(true);
    try {
      // Clear storage directly
      await AsyncStorage.multiRemove(['token', 'user']);
      // Call the store logout
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    // Navigate to login
    router.replace('/auth/login');
  };

  const handleLogout = () => {
    if (loggingOut) return;
    
    // On web, Alert.alert doesn't work - use window.confirm instead
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        doLogout();
      }
    } else {
      // On native, use the native Alert
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: doLogout },
        ]
      );
    }
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

  // Format date as DD-MM-YYYY for display/input
  // Parse directly from YYYY-MM-DD to avoid timezone issues
  const formatDateDDMMYYYY = (dateString: string) => {
    if (!dateString) return '';
    // If already in DD-MM-YYYY format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) return dateString;
    // Parse YYYY-MM-DD format
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return dateString;
  };

  // Convert DD-MM-YYYY to YYYY-MM-DD for API
  const convertToISODate = (ddmmyyyy: string): string => {
    if (!ddmmyyyy) return '';
    // Check if already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(ddmmyyyy)) return ddmmyyyy;
    // Convert DD-MM-YYYY to YYYY-MM-DD
    const parts = ddmmyyyy.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return ddmmyyyy;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = { CA: '#a855f7', MANAGER: '#3b82f6', STAFF: '#6b7280' };
    return colors[role] || '#6b7280';
  };

  if (loading) {
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
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}>
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

            {/* Subscription Badge (CA only) */}
            {displayProfile.role === 'CA' && subscription && (
              <View style={styles.subscriptionCard}>
                <View style={styles.subscriptionHeader}>
                  <Text style={styles.subscriptionIcon}>
                    {subscription.subscription.plan === 'FREE' ? '⚡' : 
                     subscription.subscription.plan === 'BASIC' ? '🏢' :
                     subscription.subscription.plan === 'PROFESSIONAL' ? '👑' : '🚀'}
                  </Text>
                  <View>
                    <Text style={styles.subscriptionPlan}>{subscription.subscription.planName} Plan</Text>
                    <Text style={styles.subscriptionStatus}>
                      {subscription.subscription.plan === 'FREE' ? 'Limited features' : 'Active subscription'}
                    </Text>
                  </View>
                </View>
                <View style={styles.usageContainer}>
                  <View style={styles.usageItem}>
                    <Text style={styles.usageLabel}>Clients</Text>
                    <Text style={styles.usageValue}>
                      {subscription.usage.clients.used}/{subscription.usage.clients.limit === -1 ? '∞' : subscription.usage.clients.limit}
                    </Text>
                  </View>
                  <View style={styles.usageItem}>
                    <Text style={styles.usageLabel}>Team</Text>
                    <Text style={styles.usageValue}>
                      {subscription.usage.users.used}/{subscription.usage.users.limit === -1 ? '∞' : subscription.usage.users.limit}
                    </Text>
                  </View>
                </View>
                {subscription.subscription.plan === 'FREE' && (
                  <TouchableOpacity 
                    style={styles.upgradeButton}
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        window.alert('To upgrade your subscription plan and unlock more features, please visit the web app settings.\n\nGo to: Settings → Subscription');
                      } else {
                        Alert.alert(
                          'Upgrade Plan',
                          'To upgrade your subscription plan and unlock more features, please visit the web app settings.\n\nGo to: Settings → Subscription',
                          [{ text: 'OK', style: 'default' }]
                        );
                      }
                    }}
                  >
                    <Text style={styles.upgradeButtonText}>Upgrade Plan →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
                onPress={() => setActiveTab('profile')}
              >
                <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'edit' && styles.tabActive]}
                onPress={() => {
                  const birthdayISO = displayProfile?.birthday ? displayProfile.birthday.split('T')[0] : '';
                  setEditData({ 
                    name: displayProfile?.name || '', 
                    phone: displayProfile?.phone || '',
                    birthday: birthdayISO ? formatDateDDMMYYYY(birthdayISO) : '',
                  });
                  setActiveTab('edit');
                }}
              >
                <Text style={[styles.tabText, activeTab === 'edit' && styles.tabTextActive]}>Edit</Text>
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
                {displayProfile.birthday && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>🎂 Birthday</Text>
                    <Text style={styles.infoValue}>{formatDate(displayProfile.birthday)}</Text>
                  </View>
                )}
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

            {activeTab === 'edit' && (
              <View style={styles.editSection}>
                <Text style={styles.passwordTitle}>✏️ Edit Profile</Text>
                <Text style={styles.passwordSubtitle}>Update your personal information</Text>
                
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#9ca3af"
                  value={editData.name}
                  onChangeText={(text) => setEditData({ ...editData, name: text })}
                />
                
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9ca3af"
                  value={editData.phone}
                  onChangeText={(text) => setEditData({ ...editData, phone: text })}
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>🎂 Birthday</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD-MM-YYYY (e.g., 15-01-1990)"
                  placeholderTextColor="#9ca3af"
                  value={editData.birthday}
                  onChangeText={(text) => setEditData({ ...editData, birthday: text })}
                />
                <Text style={styles.inputHint}>Add your birthday to receive greetings! Format: DD-MM-YYYY</Text>
                
                <TouchableOpacity
                  style={[styles.changePasswordButton, savingProfile && styles.buttonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  <Text style={styles.changePasswordButtonText}>
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  onPress={() => setActiveTab('profile')}
                >
                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                </TouchableOpacity>
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

        <TouchableOpacity 
          style={[styles.logoutButton, loggingOut && { opacity: 0.6 }]} 
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonText}>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Text>
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
  subscriptionCard: { 
    width: '100%', 
    backgroundColor: '#f8fafc', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subscriptionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginBottom: 12,
  },
  subscriptionIcon: { 
    fontSize: 28,
  },
  subscriptionPlan: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0f172a',
  },
  subscriptionStatus: { 
    fontSize: 12, 
    color: '#64748b',
  },
  usageContainer: { 
    flexDirection: 'row', 
    gap: 16, 
    marginBottom: 12,
  },
  usageItem: { 
    flex: 1, 
    backgroundColor: '#ffffff', 
    padding: 12, 
    borderRadius: 8,
    alignItems: 'center',
  },
  usageLabel: { 
    fontSize: 12, 
    color: '#64748b', 
    marginBottom: 4,
  },
  usageValue: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0f172a',
  },
  upgradeButton: { 
    backgroundColor: '#7c3aed', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center',
  },
  upgradeButtonText: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '600',
  },
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
  inputHint: { fontSize: 12, color: '#9ca3af', marginTop: -12, marginBottom: 16 },
  changePasswordButton: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  changePasswordButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  editSection: { width: '100%' },
  cancelEditButton: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  cancelEditButtonText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
  noProfileCard: { backgroundColor: 'white', margin: 16, padding: 32, borderRadius: 16, alignItems: 'center' },
  noProfileText: { fontSize: 16, color: '#64748b', marginBottom: 16 },
  retryButton: { backgroundColor: '#0ea5e9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  logoutButton: { backgroundColor: '#ef4444', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
