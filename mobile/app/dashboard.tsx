import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface DashboardMetrics {
  activeTasks: number;
  activeTasksChange: number;
  pendingApprovals: number;
  overdueItems: number;
  documents: number;
  activeClients: number;
  firmsManaged: number;
  monthlyRevenue: number;
  unpaidInvoices: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadDashboard();
  }, [isAuthenticated]);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/dashboard/metrics');
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (!isAuthenticated || loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CA Firm Management</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.greeting}>Good morning, {user?.name}</Text>

        {metrics && (
          <View style={styles.metricsGrid}>
            <MetricCard title="Active Tasks" value={metrics.activeTasks} />
            <MetricCard title="Pending Approvals" value={metrics.pendingApprovals} />
            <MetricCard title="Overdue Items" value={metrics.overdueItems} />
            <MetricCard title="Documents" value={metrics.documents} />
            <MetricCard title="Active Clients" value={metrics.activeClients} />
            <MetricCard title="Firms Managed" value={metrics.firmsManaged} />
            {(user?.role === 'CA' || user?.role === 'MANAGER') && (
              <MetricCard
                title="Monthly Revenue"
                value={`₹${metrics.monthlyRevenue.toLocaleString('en-IN')}`}
              />
            )}
            <MetricCard title="Unpaid Invoices" value={metrics.unpaidInvoices} />
          </View>
        )}

        <View style={styles.navSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <NavButton title="Clients" onPress={() => router.push('/clients')} />
          <NavButton title="Firms" onPress={() => router.push('/firms')} />
          <NavButton title="Tasks" onPress={() => router.push('/tasks')} />
          <NavButton title="Invoices" onPress={() => router.push('/invoices')} />
          <NavButton title="Documents" onPress={() => router.push('/documents')} />
          <NavButton title="Approvals" onPress={() => router.push('/approvals')} />
        </View>
      </View>
    </ScrollView>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function NavButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.navButton} onPress={onPress}>
      <Text style={styles.navButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  greeting: {
    fontSize: 18,
    marginBottom: 16,
    color: '#666',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  navSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  navButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

