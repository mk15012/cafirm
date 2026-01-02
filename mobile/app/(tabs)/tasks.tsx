import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  firm: { name: string; client: { name: string } };
  assignedTo: { name: string };
}

export default function TasksTabScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const isIndividual = user?.role === 'INDIVIDUAL';

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    }
  }, [isAuthenticated]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks');
      setTasks(response.data || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading {isIndividual ? 'reminders' : 'tasks'}...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isIndividual ? 'My Reminders' : 'Tasks'}</Text>
        <Text style={styles.headerSubtitle}>{filteredTasks.length} {isIndividual ? 'reminders' : 'tasks'}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={isIndividual ? "Search reminders..." : "Search tasks..."}
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                statusFilter === status && styles.filterButtonActive
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[
                styles.filterButtonText,
                statusFilter === status && styles.filterButtonTextActive
              ]}>
                {status === 'ALL' ? 'All' : status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No {isIndividual ? 'Reminders' : 'Tasks'} Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || statusFilter !== 'ALL' 
                ? 'Try adjusting your filters' 
                : isIndividual ? 'Your reminders will appear here' : 'No tasks available'}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => router.push(`/tasks/${task.id}`)}
            >
              <View style={styles.taskHeader}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                  <Text style={styles.priorityText}>{task.priority}</Text>
                </View>
                <Text style={styles.taskDueDate}>
                  {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                </Text>
              </View>
              <Text style={styles.taskTitle}>{task.title}</Text>
              {!isIndividual && task.firm && (
                <Text style={styles.taskSubtext}>
                  {task.firm.client?.name} • {task.firm.name}
                </Text>
              )}
              {task.description && (
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {task.description}
                </Text>
              )}
              <View style={styles.taskFooter}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                  <Text style={styles.statusBadgeText}>{task.status.replace('_', ' ')}</Text>
                </View>
                {!isIndividual && task.assignedTo && (
                  <Text style={styles.assignedTo}>👤 {task.assignedTo.name}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: '#6b7280',
    MEDIUM: '#3b82f6',
    HIGH: '#f59e0b',
    URGENT: '#ef4444',
  };
  return colors[priority] || '#6b7280';
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
  scrollContent: { padding: 16 },
  header: {
    backgroundColor: '#0f172a',
    padding: 20,
    paddingTop: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  searchContainer: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  taskDueDate: {
    fontSize: 12,
    color: '#64748b',
  },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  taskSubtext: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  taskDescription: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  assignedTo: { fontSize: 12, color: '#64748b' },
});

