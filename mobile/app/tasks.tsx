import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';

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

export default function TasksScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firms, setFirms] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: '' });
  const [formData, setFormData] = useState({
    firmId: '',
    title: '',
    description: '',
    assignedToId: '',
    priority: 'MEDIUM',
    dueDate: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadTasks();
    loadFirms();
    loadUsers();
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

  const loadFirms = async () => {
    try {
      const response = await api.get('/firms');
      setFirms(response.data);
    } catch (error) {
      console.error('Failed to load firms');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const handleSubmit = async () => {
    if (!formData.firmId || !formData.title || !formData.assignedToId || !formData.dueDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      await api.post('/tasks', formData);
      setShowForm(false);
      setFormData({ firmId: '', title: '', description: '', assignedToId: '', priority: 'MEDIUM', dueDate: '' });
      loadTasks();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create task');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      loadTasks();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update task');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#fbbf24',
      IN_PROGRESS: '#3b82f6',
      AWAITING_APPROVAL: '#a855f7',
      COMPLETED: '#10b981',
      ERROR: '#ef4444',
      OVERDUE: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      HIGH: '#ef4444',
      MEDIUM: '#f59e0b',
      LOW: '#10b981',
    };
    return colors[priority] || '#6b7280';
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTasks} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Status:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, filters.status === '' && styles.filterChipActive]}
            onPress={() => setFilters({ status: '' })}
          >
            <Text style={[styles.filterChipText, filters.status === '' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {['PENDING', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'OVERDUE'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filters.status === status && styles.filterChipActive]}
              onPress={() => setFilters({ status })}
            >
              <Text style={[styles.filterChipText, filters.status === status && styles.filterChipTextActive]}>
                {status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Add New Task</Text>
          <Text style={styles.label}>Firm *</Text>
          <View style={styles.picker}>
            {firms.map((firm) => (
              <TouchableOpacity
                key={firm.id}
                style={[styles.pickerOption, formData.firmId === firm.id && styles.pickerOptionSelected]}
                onPress={() => setFormData({ ...formData, firmId: firm.id })}
              >
                <Text style={formData.firmId === firm.id ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                  {firm.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Title *"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
          <Text style={styles.label}>Assigned To *</Text>
          <View style={styles.picker}>
            {users.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[styles.pickerOption, formData.assignedToId === user.id && styles.pickerOptionSelected]}
                onPress={() => setFormData({ ...formData, assignedToId: user.id })}
              >
                <Text style={formData.assignedToId === user.id ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                  {user.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Priority *</Text>
          <View style={styles.picker}>
            {['HIGH', 'MEDIUM', 'LOW'].map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[styles.pickerOption, formData.priority === priority && styles.pickerOptionSelected]}
                onPress={() => setFormData({ ...formData, priority })}
              >
                <Text style={formData.priority === priority ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                  {priority}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Due Date (YYYY-MM-DD) *"
            value={formData.dueDate}
            onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={3}
          />
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowForm(false);
                setFormData({ firmId: '', title: '', description: '', assignedToId: '', priority: 'MEDIUM', dueDate: '' });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.list}>
        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={[
              styles.card,
              isOverdue(task.dueDate) && task.status !== 'COMPLETED' && styles.cardOverdue,
            ]}
            onPress={() => router.push(`/tasks/${task.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{task.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                <Text style={styles.statusBadgeText}>{task.status.replace('_', ' ')}</Text>
              </View>
            </View>
            {task.description && <Text style={styles.cardSubtext}>{task.description}</Text>}
            <Text style={styles.cardSubtext}>Firm: {task.firm.name}</Text>
            <Text style={styles.cardSubtext}>Assigned to: {task.assignedTo.name}</Text>
            <View style={styles.cardFooter}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                <Text style={styles.priorityBadgeText}>{task.priority}</Text>
              </View>
              <Text style={styles.dueDate}>
                Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                {isOverdue(task.dueDate) && task.status !== 'COMPLETED' && (
                  <Text style={styles.overdueText}> (Overdue)</Text>
                )}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {tasks.length === 0 && <Text style={styles.emptyText}>No tasks found</Text>}
      </View>
    </ScrollView>
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
  backButton: {
    color: '#0284c7',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    color: '#0284c7',
    fontSize: 16,
    fontWeight: '600',
  },
  filters: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0284c7',
  },
  filterChipText: {
    color: '#6b7280',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: 'white',
  },
  form: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 8,
  },
  pickerOptionSelected: {
    backgroundColor: '#0284c7',
  },
  pickerOptionText: {
    color: '#6b7280',
    fontSize: 14,
  },
  pickerOptionTextSelected: {
    color: 'white',
    fontSize: 14,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#0284c7',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e5e5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#0284c7',
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
  cardSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 12,
    color: '#999',
  },
  overdueText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
  },
});

