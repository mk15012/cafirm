import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  firm: { id: number; name: string; client: { id: number; name: string } };
  assignedTo: { id: number; name: string };
}

export default function TasksScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadTasks();
  }, [isAuthenticated, filters]);

  const loadTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      const response = await api.get(`/tasks?${params.toString()}`);
      setTasks(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { PENDING: '#fbbf24', IN_PROGRESS: '#3b82f6', AWAITING_APPROVAL: '#a855f7', COMPLETED: '#10b981' };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
    return colors[priority] || '#6b7280';
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  if (!isAuthenticated || loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTasks} colors={['#0ea5e9']} />}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tasks</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['', 'PENDING', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, filters.status === status && styles.filterChipActive]}
                onPress={() => setFilters({ status })}
              >
                <Text style={[styles.filterChipText, filters.status === status && styles.filterChipTextActive]}>
                  {status || 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.list}>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.card, isOverdue(task.dueDate) && task.status !== 'COMPLETED' && styles.cardOverdue]}
              onPress={() => router.push(`/tasks/${task.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{task.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                  <Text style={styles.statusBadgeText}>{task.status.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={styles.cardSubtext}>Firm: {task.firm.name}</Text>
              <Text style={styles.cardSubtext}>Assigned: {task.assignedTo.name}</Text>
              <View style={styles.cardFooter}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                  <Text style={styles.priorityBadgeText}>{task.priority}</Text>
                </View>
                <Text style={styles.dueDate}>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {tasks.length === 0 && <Text style={styles.emptyText}>No tasks found</Text>}
        </View>
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
  filters: { backgroundColor: 'white', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
  filterChipActive: { backgroundColor: '#0ea5e9' },
  filterChipText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: 'white' },
  list: { padding: 16 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardOverdue: { borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1, color: '#0f172a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  cardSubtext: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  priorityBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  dueDate: { fontSize: 12, color: '#94a3b8' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 32 },
});
