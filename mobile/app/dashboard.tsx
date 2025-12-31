import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';

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

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const isCA = user?.role === 'CA';
  const isManager = user?.role === 'MANAGER';
  const canApprove = isCA || isManager;

  useEffect(() => {
    if (isAuthenticated && !dataLoaded) {
      loadDashboard();
    }
  }, [isAuthenticated, dataLoaded]);

  const loadDashboard = async () => {
    if (dataLoaded) return;
    try {
      setLoading(true);
      const [metricsRes, tasksRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/recent-tasks'),
      ]);
      setMetrics(metricsRes.data);
      setRecentTasks(tasksRes.data || []);
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) return null;

  // Quick access buttons based on role
  const quickAccessButtons = [
    { title: 'Tasks', route: '/tasks', color: '#3b82f6', icon: '📋' },
    { title: 'Clients', route: '/clients', color: '#6366f1', icon: '🏢' },
    { title: 'Firms', route: '/firms', color: '#06b6d4', icon: '🏛️' },
    { title: 'Invoices', route: '/invoices', color: '#10b981', icon: '💰' },
    { title: 'Documents', route: '/documents', color: '#8b5cf6', icon: '📄' },
    { title: 'Profile', route: '/profile', color: '#ec4899', icon: '👤' },
  ];

  // Add role-specific buttons
  if (canApprove) {
    quickAccessButtons.push({ title: 'Approvals', route: '/approvals', color: '#f59e0b', icon: '✅' });
  }
  if (isCA) {
    quickAccessButtons.push({ title: 'Users', route: '/users', color: '#a855f7', icon: '👥' });
    quickAccessButtons.push({ title: 'Activity', route: '/activity-logs', color: '#64748b', icon: '📊' });
  }

  // Tools section buttons
  const toolButtons = [
    { title: 'Tax Calc', route: '/tools/tax-calculator', color: '#059669', icon: '🧮' },
  ];
  if (isCA) {
    toolButtons.push({ title: 'Credentials', route: '/tools/credentials', color: '#7c3aed', icon: '🔐' });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>{getCurrentGreeting()}, {user?.name} !!</Text>
            <View style={[styles.roleBadge, { backgroundColor: isCA ? '#a855f720' : isManager ? '#3b82f620' : '#6b728020' }]}>
              <Text style={[styles.roleText, { color: isCA ? '#a855f7' : isManager ? '#3b82f6' : '#6b7280' }]}>{user?.role}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics Grid */}
        {metrics && (
          <View style={styles.metricsGrid}>
            <MetricCard title="Active Tasks" value={metrics.activeTasks} color="#3b82f6" icon="📋" />
            <MetricCard title="Pending Approvals" value={metrics.pendingApprovals} color="#a855f7" icon="⏳" />
            <MetricCard title="Overdue Items" value={metrics.overdueItems} color="#ef4444" icon="⚠️" />
            <MetricCard title="Active Clients" value={metrics.activeClients} color="#10b981" icon="🏢" />
            <MetricCard title="Firms Managed" value={metrics.firmsManaged} color="#06b6d4" icon="🏛️" />
            {(isCA || isManager) && (
              <MetricCard title="Unpaid Invoices" value={metrics.unpaidInvoices} color="#f97316" icon="💰" />
            )}
          </View>
        )}

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            {quickAccessButtons.map((button) => (
              <TouchableOpacity 
                key={button.route}
                style={[styles.quickAccessButton, { borderColor: button.color }]} 
                onPress={() => router.push(button.route as any)}
              >
                <Text style={styles.quickAccessIcon}>{button.icon}</Text>
                <Text style={[styles.quickAccessText, { color: button.color }]}>{button.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tools Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tools</Text>
          <View style={styles.quickAccessGrid}>
            {toolButtons.map((button) => (
              <TouchableOpacity 
                key={button.route}
                style={[styles.quickAccessButton, { borderColor: button.color }]} 
                onPress={() => router.push(button.route as any)}
              >
                <Text style={styles.quickAccessIcon}>{button.icon}</Text>
                <Text style={[styles.quickAccessText, { color: button.color }]}>{button.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Tasks */}
        {recentTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Tasks</Text>
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
                <Text style={styles.taskSubtext}>{task.firm.client.name} • {task.firm.name}</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ title, value, color, icon }: { title: string; value: number; color: string; icon: string }) {
  return (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricIcon}>{icon}</Text>
        <Text style={styles.metricValue}>{value}</Text>
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
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
  container: { flex: 1 },
  header: {
    backgroundColor: '#0f172a',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
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
  quickAccessText: { fontSize: 12, fontWeight: '600' },
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
});
