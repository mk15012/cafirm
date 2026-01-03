import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DashboardMetrics {
  activeTasks: number;
  activeTasksChange: number;
  pendingApprovals: number;
  overdueItems: number;
  overdueItemsChange: number;
  documents: number;
  documentsChange: number;
  activeClients: number;
  activeClientsChange: number;
  firmsManaged: number;
  firmsManagedChange: number;
  monthlyRevenue: number;
  monthlyRevenueChange: number;
  unpaidInvoices: number;
}

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  firm: { name: string; client: { name: string } };
  assignedTo: { name: string };
}

interface BirthdayData {
  isMyBirthday: boolean;
  myName?: string;
  teamBirthdays: Array<{
    id: number;
    name: string;
    role: string;
    isMe: boolean;
  }>;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [birthdayData, setBirthdayData] = useState<BirthdayData | null>(null);
  const [showMyBirthdayBanner, setShowMyBirthdayBanner] = useState(true);
  const [showTeamBirthdayBanner, setShowTeamBirthdayBanner] = useState(true);

  const isCA = user?.role === 'CA';
  const isManager = user?.role === 'MANAGER';
  const isIndividual = user?.role === 'INDIVIDUAL';

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

  useEffect(() => {
    if (isAuthenticated && !dataLoaded) {
      loadDashboard();
    }
  }, [isAuthenticated, dataLoaded]);

  const loadDashboard = async () => {
    if (dataLoaded) return;
    try {
      setLoading(true);
      const [metricsRes, tasksRes, birthdayRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/recent-tasks'),
        api.get('/dashboard/birthdays-today'),
      ]);
      setMetrics(metricsRes.data);
      setRecentTasks(tasksRes.data || []);
      setBirthdayData(birthdayRes.data);
      setDataLoaded(true);
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      setMetrics({
        activeTasks: 0, activeTasksChange: 0, pendingApprovals: 0,
        overdueItems: 0, overdueItemsChange: 0, documents: 0, documentsChange: 0,
        activeClients: 0, activeClientsChange: 0, firmsManaged: 0, firmsManagedChange: 0,
        monthlyRevenue: 0, monthlyRevenueChange: 0, unpaidInvoices: 0,
      });
      setDataLoaded(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setDataLoaded(false);
    loadDashboard();
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#1e293b" />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Birthday Greeting - Show if it's user's birthday */}
        {birthdayData?.isMyBirthday && showMyBirthdayBanner && (
          <View style={styles.birthdayBanner}>
            <TouchableOpacity 
              style={styles.bannerCloseButton}
              onPress={() => setShowMyBirthdayBanner(false)}
            >
              <Text style={styles.bannerCloseText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.birthdayIconContainer}>
              <Text style={styles.birthdayEmoji}>🎂</Text>
            </View>
            <View style={styles.birthdayContent}>
              <Text style={styles.birthdayTitle}>🎉 Happy Birthday, {user?.name?.split(' ')[0]}! 🎉</Text>
              <Text style={styles.birthdaySubtitle}>Wishing you a fantastic day! 🌟</Text>
            </View>
            <Text style={styles.birthdayDecor}>🎈🎁</Text>
          </View>
        )}

        {/* Team Birthdays - Show for CA and Manager users */}
        {(isCA || isManager) && birthdayData?.teamBirthdays && birthdayData.teamBirthdays.filter(b => !b.isMe).length > 0 && showTeamBirthdayBanner && (
          <View style={styles.teamBirthdayBanner}>
            <TouchableOpacity 
              style={styles.teamBannerCloseButton}
              onPress={() => setShowTeamBirthdayBanner(false)}
            >
              <Text style={styles.teamBannerCloseText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.teamBirthdayHeader}>
              <Text style={styles.teamBirthdayIcon}>🎂</Text>
              <Text style={styles.teamBirthdayTitle}>Today's Birthdays</Text>
            </View>
            <View style={styles.teamBirthdayList}>
              {birthdayData.teamBirthdays.filter(b => !b.isMe).map((person) => (
                <View key={person.id} style={styles.birthdayPerson}>
                  <Text style={styles.birthdayPersonEmoji}>🎈</Text>
                  <Text style={styles.birthdayPersonName}>{person.name}</Text>
                  <View style={styles.birthdayPersonRole}>
                    <Text style={styles.birthdayPersonRoleText}>{person.role}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              {isIndividual ? 'My Dashboard' : 'Dashboard'}
            </Text>
            <Text style={styles.headerSubtitle}>{getCurrentGreeting()}, {user?.name?.split(' ')[0]}!</Text>
            <View style={[styles.roleBadge, { backgroundColor: isCA ? '#a855f720' : isManager ? '#3b82f620' : isIndividual ? '#10b98120' : '#6b728020' }]}>
              <Text style={[styles.roleText, { color: isCA ? '#a855f7' : isManager ? '#3b82f6' : isIndividual ? '#10b981' : '#6b7280' }]}>
                {isIndividual ? 'Personal' : user?.role}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics Grid */}
        {metrics && (
          <View style={styles.metricsGrid}>
            <MetricCard 
              title={isIndividual ? "My Reminders" : "Active Tasks"} 
              value={metrics.activeTasks} 
              color="#3b82f6" 
              icon="📋" 
            />
            {!isIndividual && (
              <MetricCard title="Pending Approvals" value={metrics.pendingApprovals} color="#a855f7" icon="⏳" />
            )}
            <MetricCard title="Overdue Items" value={metrics.overdueItems} color="#ef4444" icon="⚠️" />
            <MetricCard 
              title={isIndividual ? "My Documents" : "Documents"} 
              value={metrics.documents} 
              color="#8b5cf6" 
              icon="📄" 
            />
            {!isIndividual && (
              <>
                <MetricCard title="Active Clients" value={metrics.activeClients} color="#10b981" icon="🏢" />
                <MetricCard title="Firms Managed" value={metrics.firmsManaged} color="#06b6d4" icon="🏛️" />
              </>
            )}
            {isCA && (
              <MetricCard title="Monthly Revenue" value={metrics.monthlyRevenue} color="#22c55e" icon="💵" isRevenue />
            )}
            {(isCA || isManager) && (
              <MetricCard title="Unpaid Invoices" value={metrics.unpaidInvoices} color="#f97316" icon="💰" />
            )}
          </View>
        )}

        {/* Recent Tasks */}
        {recentTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isIndividual ? 'My Upcoming Reminders' : 'Recent Tasks'}
              </Text>
              <TouchableOpacity onPress={() => router.push('/tasks')}>
                <Text style={styles.viewAll}>View All →</Text>
              </TouchableOpacity>
            </View>
            {recentTasks.slice(0, 3).map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskCard}
                onPress={() => router.push(`/tasks/${task.id}`)}
              >
                <Text style={styles.taskTitle}>{task.title}</Text>
                {!isIndividual && (
                  <Text style={styles.taskSubtext}>{task.firm?.client?.name} • {task.firm?.name}</Text>
                )}
                <View style={styles.taskFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                    <Text style={styles.statusBadgeText}>{task.status.replace('_', ' ')}</Text>
                  </View>
                  <Text style={styles.taskDueDate}>Due: {format(new Date(task.dueDate), 'MMM dd')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Bottom padding for tab bar */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ title, value, color, icon, isRevenue }: { title: string; value: number; color: string; icon: string; isRevenue?: boolean }) {
  const formatValue = () => {
    if (isRevenue) {
      if (value >= 100000) {
        return `₹${(value / 100000).toFixed(1)}L`;
      } else if (value >= 1000) {
        return `₹${(value / 1000).toFixed(1)}K`;
      }
      return `₹${value}`;
    }
    return value;
  };

  return (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricIcon}>{icon}</Text>
        <Text style={styles.metricValue}>{formatValue()}</Text>
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: '#fbbf24',
    IN_PROGRESS: '#3b82f6',
    AWAITING_APPROVAL: '#a855f7',
    COMPLETED: '#10b981',
  };
  return colors[status] || '#6b7280';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 20 },
  header: {
    backgroundColor: '#0f172a',
    padding: 20,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start', marginTop: 8 },
  roleText: { fontSize: 11, fontWeight: '600' },
  logoutButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#ef4444', borderRadius: 8 },
  logoutText: { color: 'white', fontSize: 14, fontWeight: '600' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  metricCard: {
    width: '47%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metricIcon: { fontSize: 20, marginRight: 8 },
  metricValue: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  metricTitle: { fontSize: 12, color: '#64748b' },
  section: { padding: 16, paddingTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  viewAll: { fontSize: 14, color: '#0ea5e9', fontWeight: '600' },
  quickAccessGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickAccessButton: {
    width: '30%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  quickAccessIcon: { fontSize: 24, marginBottom: 8 },
  quickAccessText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickActionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: { fontSize: 28, marginBottom: 8 },
  quickActionText: { fontSize: 13, fontWeight: '600', color: 'white' },
  taskCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  taskSubtext: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  taskDueDate: { fontSize: 12, color: '#94a3b8' },
  // Birthday styles
  birthdayBanner: {
    backgroundColor: '#ec4899',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  bannerCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bannerCloseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  birthdayIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  birthdayEmoji: {
    fontSize: 24,
  },
  birthdayContent: {
    flex: 1,
  },
  birthdayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  birthdaySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  birthdayDecor: {
    fontSize: 20,
  },
  // Team birthday styles
  teamBirthdayBanner: {
    backgroundColor: '#fffbeb',
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    position: 'relative',
  },
  teamBannerCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    backgroundColor: '#fef3c7',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  teamBannerCloseText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: 'bold',
  },
  teamBirthdayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamBirthdayIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  teamBirthdayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  teamBirthdayList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  birthdayPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 6,
  },
  birthdayPersonEmoji: {
    fontSize: 14,
  },
  birthdayPersonName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  birthdayPersonRole: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  birthdayPersonRoleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400e',
  },
});

