import { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';

// Helper to check if user is INDIVIDUAL

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

interface Client {
  id: number;
  name: string;
}

interface Firm {
  id: number;
  name: string;
  client: { id: number; name: string };
}

interface User {
  id: number;
  name: string;
}

export default function TasksScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ status: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingReminders, setGeneratingReminders] = useState(false);

  const isIndividual = user?.role === 'INDIVIDUAL';
  
  // Form state
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    firmId: '',
    title: '',
    description: '',
    assignedToId: '',
    priority: 'MEDIUM',
    dueDate: '',
  });

  // Filter firms based on selected client
  const filteredFirms = useMemo(() => {
    if (!selectedClientId) return [];
    return firms.filter(firm => firm.client.id === selectedClientId);
  }, [firms, selectedClientId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
      loadClients();
      loadFirms();
      loadUsers();
    }
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

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const loadFirms = async () => {
    try {
      const response = await api.get('/firms');
      setFirms(response.data);
    } catch (error) {
      console.error('Failed to load firms:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleClientChange = (clientId: number | null) => {
    setSelectedClientId(clientId);
    setFormData({ ...formData, firmId: '' });
  };

  const handleSubmit = async () => {
    if (!formData.firmId || !formData.title || !formData.assignedToId || !formData.dueDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/tasks', formData);
      Alert.alert('Success', 'Task created successfully!');
      setShowAddModal(false);
      resetForm();
      loadTasks();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedClientId(null);
    setFormData({
      firmId: '',
      title: '',
      description: '',
      assignedToId: '',
      priority: 'MEDIUM',
      dueDate: '',
    });
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
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isIndividual ? 'My Reminders' : 'Tasks'}</Text>
          {isIndividual ? (
            <TouchableOpacity 
              onPress={() => generateReminders(false)} 
              disabled={generatingReminders}
              style={generatingReminders ? { opacity: 0.5 } : undefined}
            >
              <Text style={styles.generateButton}>{generatingReminders ? '...' : '✨ Generate'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowAddModal(true)}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters - Only for CA/MANAGER/STAFF */}
        {!isIndividual && (
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
        )}

        <View style={styles.list}>
          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              {isIndividual && filters.status === '' ? (
                <>
                  <Text style={styles.emptyIcon}>🔔</Text>
                  <Text style={styles.emptyTitle}>No Reminders Yet</Text>
                  <Text style={styles.emptyText}>
                    Generate your tax deadline reminders for the financial year
                  </Text>
                  <Text style={styles.emptySubtext}>
                    We'll create reminders for ITR filing, advance tax, Form 16, and more.
                  </Text>
                  <TouchableOpacity
                    style={[styles.generateMainButton, generatingReminders && styles.disabledButton]}
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
                    style={[styles.generateSecondaryButton, generatingReminders && styles.disabledButton]}
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
                    {filters.status ? 'Try a different filter' : 'No tasks available'}
                  </Text>
                </>
              )}
            </View>
          ) : (
            tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.card, isOverdue(task.dueDate) && task.status !== 'COMPLETED' && styles.cardOverdue]}
                onPress={() => router.push(`/tasks/${task.id}`)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{task.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                    <Text style={styles.statusBadgeText}>{task.status.replace('_', ' ')}</Text>
                  </View>
                </View>
                {!isIndividual && (
                  <>
                    <Text style={styles.cardSubtext}>Client: {task.firm.client.name}</Text>
                    <Text style={styles.cardSubtext}>Firm: {task.firm.name}</Text>
                    <Text style={styles.cardSubtext}>Assigned: {task.assignedTo.name}</Text>
                  </>
                )}
                {task.description && isIndividual && (
                  <Text style={styles.cardDescription} numberOfLines={2}>{task.description}</Text>
                )}
                <View style={styles.cardFooter}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                    <Text style={styles.priorityBadgeText}>{task.priority}</Text>
                  </View>
                  <Text style={styles.dueDate}>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Client Selection */}
              <Text style={styles.label}>Client *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedClientId}
                  onValueChange={(value) => handleClientChange(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Client First" value={null} />
                  {clients.map(client => (
                    <Picker.Item key={client.id} label={client.name} value={client.id} />
                  ))}
                </Picker>
              </View>

              {/* Firm Selection */}
              <Text style={styles.label}>Firm *</Text>
              <View style={[styles.pickerContainer, !selectedClientId && styles.disabledPicker]}>
                <Picker
                  selectedValue={formData.firmId}
                  onValueChange={(value) => setFormData({ ...formData, firmId: value })}
                  enabled={!!selectedClientId}
                  style={styles.picker}
                >
                  <Picker.Item 
                    label={!selectedClientId ? "Select a client first" : filteredFirms.length === 0 ? "No firms for this client" : "Select Firm"} 
                    value="" 
                  />
                  {filteredFirms.map(firm => (
                    <Picker.Item key={firm.id} label={firm.name} value={firm.id.toString()} />
                  ))}
                </Picker>
              </View>
              {selectedClientId && filteredFirms.length === 0 && (
                <Text style={styles.warningText}>This client has no firms. Add a firm first.</Text>
              )}

              {/* Title */}
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter task title"
              />

              {/* Assigned To */}
              <Text style={styles.label}>Assign To *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.assignedToId}
                  onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select User" value="" />
                  {users.map(user => (
                    <Picker.Item key={user.id} label={user.name} value={user.id.toString()} />
                  ))}
                </Picker>
              </View>

              {/* Priority */}
              <Text style={styles.label}>Priority *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="High" value="HIGH" />
                  <Picker.Item label="Medium" value="MEDIUM" />
                  <Picker.Item label="Low" value="LOW" />
                </Picker>
              </View>

              {/* Due Date */}
              <Text style={styles.label}>Due Date * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={formData.dueDate}
                onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                placeholder="2025-01-15"
              />

              {/* Description */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter task description"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => { setShowAddModal(false); resetForm(); }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, submitting && styles.disabledButton]} 
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Creating...' : 'Create Task'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: { color: '#10b981', fontSize: 16, fontWeight: '600' },
  generateButton: { color: '#0ea5e9', fontSize: 14, fontWeight: '600' },
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
  cardDescription: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 4 },
  
  // Empty state styles
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  emptySubtext: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 18 },
  generateMainButton: { backgroundColor: '#0ea5e9', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10, marginBottom: 12, minWidth: 240, alignItems: 'center' },
  generateMainButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  generateSecondaryButton: { backgroundColor: '#ffffff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', minWidth: 240, alignItems: 'center' },
  generateSecondaryButtonText: { color: '#64748b', fontWeight: '600', fontSize: 15 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  closeButton: { fontSize: 20, color: '#64748b', padding: 4 },
  modalBody: { padding: 16 },
  modalFooter: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' },
  disabledPicker: { backgroundColor: '#e5e7eb' },
  picker: { height: 50 },
  warningText: { color: '#f59e0b', fontSize: 12, marginTop: 4 },
  
  cancelButton: { flex: 1, backgroundColor: '#e5e7eb', padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
  submitButton: { flex: 1, backgroundColor: '#0ea5e9', padding: 14, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
});
