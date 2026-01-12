import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Alert } from 'react-native';
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
  const [fyFilter, setFyFilter] = useState<string>('ALL');
  const [generatingReminders, setGeneratingReminders] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [firms, setFirms] = useState<Array<{ id: number; name: string }>>([]);

  const isIndividual = user?.role === 'INDIVIDUAL';

  // Extract unique FYs from task titles
  const availableFYs = Array.from(new Set(
    tasks
      .map(task => {
        const match = task.title.match(/FY (\d{4}-\d{2})/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[]
  )).sort().reverse();

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
      loadFirms();
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

  const loadFirms = async () => {
    try {
      const response = await api.get('/firms');
      setFirms(response.data || []);
    } catch (error) {
      console.error('Failed to load firms:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDueDate) {
      Alert.alert('Error', 'Please enter a title and due date');
      return;
    }

    try {
      setCreatingTask(true);
      
      // Find the personal firm for individual user
      const personalFirm = firms.find(f => f.name === 'Personal') || firms[0];
      if (!personalFirm) {
        Alert.alert('Error', 'No firm found. Please try again later.');
        return;
      }

      await api.post('/tasks', {
        firmId: personalFirm.id,
        title: newTaskTitle,
        description: newTaskDescription,
        priority: newTaskPriority,
        dueDate: newTaskDueDate,
        assignedToId: user?.id,
      });

      Alert.alert('Success', 'Task created successfully!');
      setShowAddTask(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('MEDIUM');
      setNewTaskDueDate('');
      loadTasks();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const generateReminders = async (forNextYear = false) => {
    try {
      setGeneratingReminders(true);
      const endpoint = forNextYear ? '/tasks/generate-next-year-tasks' : '/tasks/generate-tax-tasks';
      const response = await api.post(endpoint);
      Alert.alert('Success', response.data.message || 'Tax reminders generated successfully!');
      loadTasks();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to generate reminders';
      Alert.alert('Error', errorMsg);
    } finally {
      setGeneratingReminders(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesFY = fyFilter === 'ALL' || task.title.includes(`FY ${fyFilter}`);
    return matchesSearch && matchesStatus && matchesFY;
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
        <View style={styles.headerRow}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{isIndividual ? 'My Reminders' : 'Tasks'}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {isIndividual 
                ? 'Tax deadlines & compliance' 
                : `${filteredTasks.length} tasks`}
            </Text>
          </View>
          {isIndividual ? (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={() => setShowAddTask(true)}
              >
                <Text style={styles.addTaskButtonText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.generateButton, generatingReminders && styles.generateButtonDisabled]}
                onPress={() => generateReminders(false)}
                disabled={generatingReminders}
              >
                {generatingReminders ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.generateButtonText}>✨ Generate</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/tasks/add')}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
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

      {/* FY Filter for Individuals */}
      {isIndividual && availableFYs.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                fyFilter === 'ALL' && styles.filterButtonActive
              ]}
              onPress={() => setFyFilter('ALL')}
            >
              <Text style={[
                styles.filterButtonText,
                fyFilter === 'ALL' && styles.filterButtonTextActive
              ]}>
                All Years
              </Text>
            </TouchableOpacity>
            {availableFYs.map((fy) => (
              <TouchableOpacity
                key={fy}
                style={[
                  styles.filterButton,
                  fyFilter === fy && styles.filterButtonActive
                ]}
                onPress={() => setFyFilter(fy)}
              >
                <Text style={[
                  styles.filterButtonText,
                  fyFilter === fy && styles.filterButtonTextActive
                ]}>
                  FY {fy}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Status Filter - Only for CA/MANAGER/STAFF */}
      {!isIndividual && (
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
      )}

      {/* Add Task Form for Individuals */}
      {showAddTask && isIndividual && (
        <View style={styles.addTaskForm}>
          <View style={styles.addTaskHeader}>
            <Text style={styles.addTaskTitle}>Add Custom Task</Text>
            <TouchableOpacity onPress={() => setShowAddTask(false)}>
              <Text style={styles.addTaskClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.addTaskInput}
            placeholder="Task title *"
            placeholderTextColor="#94a3b8"
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
          />
          <TextInput
            style={styles.addTaskInput}
            placeholder="Description (optional)"
            placeholderTextColor="#94a3b8"
            value={newTaskDescription}
            onChangeText={setNewTaskDescription}
          />
          <TextInput
            style={styles.addTaskInput}
            placeholder="Due date (YYYY-MM-DD) *"
            placeholderTextColor="#94a3b8"
            value={newTaskDueDate}
            onChangeText={setNewTaskDueDate}
          />
          <View style={styles.priorityRow}>
            <Text style={styles.priorityLabel}>Priority:</Text>
            {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityOption,
                  newTaskPriority === p && styles.priorityOptionActive
                ]}
                onPress={() => setNewTaskPriority(p)}
              >
                <Text style={[
                  styles.priorityOptionText,
                  newTaskPriority === p && styles.priorityOptionTextActive
                ]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.addTaskButtons}>
            <TouchableOpacity
              style={styles.addTaskCancel}
              onPress={() => setShowAddTask(false)}
            >
              <Text style={styles.addTaskCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addTaskSubmit, creatingTask && styles.generateButtonDisabled]}
              onPress={handleCreateTask}
              disabled={creatingTask}
            >
              {creatingTask ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.addTaskSubmitText}>Create Task</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            {isIndividual && !searchQuery && statusFilter === 'ALL' ? (
              <>
                <Text style={styles.emptyIcon}>🔔</Text>
                <Text style={styles.emptyTitle}>No Reminders Yet</Text>
                <Text style={styles.emptyText}>
                  Generate your tax deadline reminders for the current financial year
                </Text>
                <Text style={styles.emptySubtext}>
                  We'll create reminders for ITR filing, advance tax payments, Form 16 collection, and other important deadlines.
                </Text>
                <TouchableOpacity
                  style={[styles.generateMainButton, generatingReminders && styles.generateButtonDisabled]}
                  onPress={() => generateReminders(false)}
                  disabled={generatingReminders}
                >
                  {generatingReminders ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.generateMainButtonText}>✨ Generate Current FY Reminders</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.generateSecondaryButton, generatingReminders && styles.generateButtonDisabled]}
                  onPress={() => generateReminders(true)}
                  disabled={generatingReminders}
                >
                  <Text style={styles.generateSecondaryButtonText}>📅 Generate Next FY Reminders</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No {isIndividual ? 'Reminders' : 'Tasks'} Found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery || statusFilter !== 'ALL' 
                    ? 'Try adjusting your filters' 
                    : 'No tasks available'}
                </Text>
              </>
            )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  generateButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  addTaskButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
  },
  addTaskButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  addTaskForm: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addTaskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  addTaskClose: {
    fontSize: 20,
    color: '#94a3b8',
    padding: 4,
  },
  addTaskInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#0f172a',
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  priorityLabel: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },
  priorityOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  priorityOptionActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  priorityOptionText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  priorityOptionTextActive: {
    color: '#ffffff',
  },
  addTaskButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addTaskCancel: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addTaskCancelText: {
    color: '#64748b',
    fontWeight: '600',
  },
  addTaskSubmit: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addTaskSubmitText: {
    color: '#ffffff',
    fontWeight: '600',
  },
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
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingHorizontal: 20 },
  emptySubtext: { 
    fontSize: 12, 
    color: '#94a3b8', 
    textAlign: 'center', 
    paddingHorizontal: 30,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 18,
  },
  generateMainButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    minWidth: 240,
    alignItems: 'center',
  },
  generateMainButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  generateSecondaryButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 240,
    alignItems: 'center',
  },
  generateSecondaryButtonText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 15,
  },
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



