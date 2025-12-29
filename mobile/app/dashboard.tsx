import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
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
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  firm: {
    id: string;
    name: string;
    client: { id: string; name: string };
  };
  assignedTo: { id: string; name: string };
}

interface Deadline {
  id: string;
  title: string;
  type: string;
  firm: string;
  client: string;
  dueDate: string;
  priority: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, initializeAuth } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/auth/login');
        return;
      }
      if (isAuthenticated && !dataLoaded) {
        loadDashboard();
      }
    }
  }, [isAuthenticated, isLoading, dataLoaded]);

  const loadDashboard = async () => {
    if (dataLoaded) return;
    try {
      setLoading(true);
      const [metricsRes, tasksRes, deadlinesRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/recent-tasks'),
        api.get('/dashboard/upcoming-deadlines'),
      ]);
      setMetrics(metricsRes.data);
      setRecentTasks(tasksRes.data || []);
      setUpcomingDeadlines(deadlinesRes.data || []);
      setDataLoaded(true);
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      setMetrics({
        activeTasks: 0,
        activeTasksChange: 0,
        pendingApprovals: 0,
        overdueItems: 0,
        overdueItemsChange: 0,
        documents: 0,
        documentsChange: 0,
        activeClients: 0,
        activeClientsChange: 0,
        firmsManaged: 0,
        firmsManagedChange: 0,
        monthlyRevenue: 0,
        monthlyRevenueChange: 0,
        unpaidInvoices: 0,
      });
      setRecentTasks([]);
      setUpcomingDeadlines([]);
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

  if (isLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>CA Firm Management</Text>
          <Text style={styles.headerSubtitle}>
            {getCurrentGreeting()}, {user?.name}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <Text style={styles.welcomeTitle}>
          {getCurrentGreeting()}, {user?.name}!
        </Text>
        <Text style={styles.welcomeSubtitle}>
          Here's what's happening with your firm today • {format(new Date(), 'EEEE d MMMM, yyyy')}
        </Text>
      </View>

      {/* Metrics Grid */}
      {metrics && (
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Active Tasks"
            value={metrics.activeTasks}
            change={metrics.activeTasksChange}
            iconColor="#3b82f6"
            bgColor="#dbeafe"
          />
          <MetricCard
            title="Pending Approvals"
            value={metrics.pendingApprovals}
            iconColor="#a855f7"
            bgColor="#f3e8ff"
          />
          <MetricCard
            title="Overdue Items"
            value={metrics.overdueItems}
            change={metrics.overdueItemsChange}
            iconColor="#ef4444"
            bgColor="#fee2e2"
          />
          <MetricCard
            title="Documents"
            value={metrics.documents}
            change={metrics.documentsChange}
            iconColor="#10b981"
            bgColor="#d1fae5"
          />
          <MetricCard
            title="Active Clients"
            value={metrics.activeClients}
            change={metrics.activeClientsChange}
            iconColor="#6366f1"
            bgColor="#e0e7ff"
          />
          <MetricCard
            title="Firms Managed"
            value={metrics.firmsManaged}
            change={metrics.firmsManagedChange}
            iconColor="#06b6d4"
            bgColor="#cffafe"
          />
          {(user?.role === 'CA' || user?.role === 'MANAGER') && (
            <MetricCard
              title="Monthly Revenue"
              value={`₹${metrics.monthlyRevenue.toLocaleString('en-IN')}`}
              change={metrics.monthlyRevenueChange}
              iconColor="#059669"
              bgColor="#d1fae5"
            />
          )}
          <MetricCard
            title="Unpaid Invoices"
            value={metrics.unpaidInvoices}
            iconColor="#f97316"
            bgColor="#fed7aa"
          />
        </View>
      )}

      {/* Quick Access */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickAccessGrid}>
          <QuickAccessButton title="Tasks" onPress={() => router.push('/tasks')} color="#3b82f6" />
          <QuickAccessButton title="Clients" onPress={() => router.push('/clients')} color="#6366f1" />
          <QuickAccessButton title="Firms" onPress={() => router.push('/firms')} color="#06b6d4" />
          <QuickAccessButton title="Invoices" onPress={() => router.push('/invoices')} color="#10b981" />
          <QuickAccessButton title="Documents" onPress={() => router.push('/documents')} color="#8b5cf6" />
          <QuickAccessButton title="Approvals" onPress={() => router.push('/approvals')} color="#f59e0b" />
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
            <TaskCard key={task.id} task={task} onPress={() => router.push(`/tasks/${task.id}`)} />
          ))}
        </View>
      )}

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
          {upcomingDeadlines.slice(0, 3).map((deadline, index) => (
            <DeadlineCard key={index} deadline={deadline} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function MetricCard({
  title,
  value,
  change,
  iconColor,
  bgColor,
}: {
  title: string;
  value: string | number;
  change?: number;
  iconColor: string;
  bgColor: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: bgColor }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {change !== undefined && change !== 0 && (
        <Text style={[styles.metricChange, { color: change > 0 ? '#10b981' : '#ef4444' }]}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
        </Text>
      )}
    </View>
  );
}

function QuickAccessButton({ title, onPress, color }: { title: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      style={[styles.quickAccessButton, { borderColor: color }]}
      onPress={onPress}
    >
      <Text style={[styles.quickAccessText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
  return (
    <TouchableOpacity
      style={[styles.taskCard, isOverdue && styles.taskCardOverdue]}
      onPress={onPress}
    >
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.taskSubtext}>{task.firm.client.name} • {task.firm.name}</Text>
      <Text style={styles.taskSubtext}>Assigned to: {task.assignedTo.name}</Text>
      <View style={styles.taskFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.statusBadgeText}>{task.status.replace('_', ' ')}</Text>
        </View>
        <Text style={styles.taskDueDate}>
          Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
          {isOverdue && <Text style={styles.overdueText}> (Overdue)</Text>}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function DeadlineCard({ deadline }: { deadline: Deadline }) {
  const daysUntilDue = Math.ceil((new Date(deadline.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntilDue <= 7;
  
  return (
    <View style={[styles.deadlineCard, isUrgent && styles.deadlineCardUrgent]}>
      <Text style={styles.deadlineTitle}>{deadline.title}</Text>
      <Text style={styles.deadlineSubtext}>{deadline.client} • {deadline.firm}</Text>
      <View style={styles.deadlineFooter}>
        <Text style={styles.deadlineDate}>
          {format(new Date(deadline.dueDate), 'MMM dd, yyyy')}
        </Text>
        {isUrgent && (
          <Text style={styles.urgentText}>
            {daysUntilDue === 0 ? 'Due today!' : `${daysUntilDue} days left`}
          </Text>
        )}
      </View>
    </View>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: '#fbbf24',
    IN_PROGRESS: '#3b82f6',
    AWAITING_APPROVAL: '#a855f7',
    COMPLETED: '#10b981',
    ERROR: '#ef4444',
    OVERDUE: '#ef4444',
  };
  return colors[status] || '#6b7280';
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  welcomeBanner: {
    backgroundColor: '#0284c7',
    padding: 20,
    margin: 16,
    borderRadius: 12,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 14,
    color: '#0284c7',
    fontWeight: '600',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAccessButton: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'white',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAccessText: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0284c7',
    marginBottom: 8,
  },
  taskSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  taskDueDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  overdueText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  deadlineCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deadlineCardUrgent: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  deadlineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  deadlineSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  deadlineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  urgentText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
});
