import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MenuItemProps {
  title: string;
  subtitle?: string;
  icon: string;
  iconColor: string;
  onPress: () => void;
}

function MenuItem({ title, subtitle, icon, iconColor, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIconContainer, { backgroundColor: iconColor + '20' }]}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.menuSection}>
      <Text style={styles.menuSectionTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {children}
      </View>
    </View>
  );
}

export default function MoreTabScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const isCA = user?.role === 'CA';
  const isManager = user?.role === 'MANAGER';
  const isIndividual = user?.role === 'INDIVIDUAL';
  const canApprove = isCA || isManager;

  const doLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    router.replace('/auth/login');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        doLogout();
      }
    } else {
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
        <Text style={styles.headerSubtitle}>Settings & Tools</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <TouchableOpacity style={styles.profileCard} onPress={() => router.push('/profile')}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={[styles.roleBadge, { 
              backgroundColor: isCA ? '#a855f720' : isManager ? '#3b82f620' : isIndividual ? '#10b98120' : '#6b728020' 
            }]}>
              <Text style={[styles.roleText, { 
                color: isCA ? '#a855f7' : isManager ? '#3b82f6' : isIndividual ? '#10b981' : '#6b7280' 
              }]}>
                {isIndividual ? 'Personal Account' : user?.role}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#94a3b8" />
        </TouchableOpacity>

        {/* Tools Section */}
        <MenuSection title="Tools">
          <MenuItem
            title="Tax Calculator"
            subtitle="Compare old vs new tax regime"
            icon="🧮"
            iconColor="#059669"
            onPress={() => router.push('/tools/tax-calculator')}
          />
          <MenuItem
            title={isIndividual ? "My Credentials" : "Portal Credentials"}
            subtitle="Securely stored login details"
            icon="🔐"
            iconColor="#7c3aed"
            onPress={() => router.push('/tools/credentials')}
          />
        </MenuSection>

        {/* For CA/Team Users */}
        {!isIndividual && (
          <>
            {/* Management Section */}
            <MenuSection title="Management">
              <MenuItem
                title="Firms"
                subtitle="Manage all firms"
                icon="🏛️"
                iconColor="#06b6d4"
                onPress={() => router.push('/firms')}
              />
              <MenuItem
                title="Invoices"
                subtitle="Billing and payments"
                icon="💰"
                iconColor="#10b981"
                onPress={() => router.push('/invoices')}
              />
              {canApprove && (
                <>
                  <MenuItem
                    title="Approvals"
                    subtitle="Pending approvals"
                    icon="✅"
                    iconColor="#f59e0b"
                    onPress={() => router.push('/approvals')}
                  />
                  <MenuItem
                    title="Meetings"
                    subtitle="Schedule and manage"
                    icon="📅"
                    iconColor="#0891b2"
                    onPress={() => router.push('/meetings')}
                  />
                </>
              )}
            </MenuSection>

            {/* CA Only Section */}
            {isCA && (
              <MenuSection title="Administration">
                <MenuItem
                  title="Users"
                  subtitle="Manage team members"
                  icon="👥"
                  iconColor="#a855f7"
                  onPress={() => router.push('/users')}
                />
                <MenuItem
                  title="Activity Log"
                  subtitle="View all activities"
                  icon="📊"
                  iconColor="#64748b"
                  onPress={() => router.push('/activity-logs')}
                />
                <MenuItem
                  title="Reports"
                  subtitle="Analytics and insights"
                  icon="📈"
                  iconColor="#dc2626"
                  onPress={() => router.push('/reports')}
                />
                <MenuItem
                  title="Compliance Calendar"
                  subtitle="Track deadlines"
                  icon="📅"
                  iconColor="#14b8a6"
                  onPress={() => router.push('/compliance')}
                />
              </MenuSection>
            )}

            {/* Settings Section (CA Only) */}
            {isCA && (
              <MenuSection title="Settings">
                <MenuItem
                  title="Services"
                  subtitle="Configure service offerings"
                  icon="📦"
                  iconColor="#6366f1"
                  onPress={() => router.push('/settings/services')}
                />
                <MenuItem
                  title="Subscription"
                  subtitle="Manage your plan"
                  icon="👑"
                  iconColor="#f59e0b"
                  onPress={() => router.push('/settings/subscription')}
                />
              </MenuSection>
            )}
          </>
        )}

        {/* Account Section */}
        <MenuSection title="Account">
          <MenuItem
            title="Profile Settings"
            subtitle="Update your information"
            icon="👤"
            iconColor="#ec4899"
            onPress={() => router.push('/profile')}
          />
        </MenuSection>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>CA Firm Pro</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16 },
  header: {
    backgroundColor: '#0f172a',
    padding: 20,
    paddingTop: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  profileCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  profileEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 3, 
    borderRadius: 12, 
    alignSelf: 'flex-start', 
    marginTop: 6 
  },
  roleText: { fontSize: 11, fontWeight: '600' },
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  menuSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 24,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  appVersion: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2,
  },
});


