import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  completedAt?: string;
  createdAt: string;
  firm: {
    id: number;
    name: string;
    client: {
      id: number;
      name: string;
    };
  };
  assignedTo: {
    id: number;
    name: string;
    email: string;
  };
  createdBy: {
    id: number;
    name: string;
  };
  approval?: {
    id: number;
    status: string;
    remarks?: string;
    createdAt: string;
    approvedAt?: string;
  };
  documents: Array<{
    id: number;
    fileName: string;
    documentType: string;
    createdAt: string;
  }>;
}

export default function TaskDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
  });

  const isCA = user?.role === 'CA';
  const isManager = user?.role === 'MANAGER';
  const isIndividual = user?.role === 'INDIVIDUAL';
  const canEdit = isCA || isManager || isIndividual;

  useEffect(() => {
    if (isAuthenticated && params.id) {
      loadTask();
    }
  }, [params.id, isAuthenticated]);

  const loadTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/tasks/${params.id}`);
      setTask(response.data);
    } catch (error: any) {
      console.error('Failed to load task:', error);
      setError(error.response?.data?.error || 'Failed to load task');
      Alert.alert('Error', error.response?.data?.error || 'Failed to load task');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openEditForm = () => {
    if (task) {
      setEditFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'MEDIUM',
      });
      setShowEditForm(true);
    }
  };

  const handleEditTask = async () => {
    try {
      await api.put(`/tasks/${params.id}`, editFormData);
      setShowEditForm(false);
      loadTask();
      Alert.alert('Success', 'Task updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task?.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/tasks/${params.id}`);
              Alert.alert('Success', 'Task deleted successfully');
              router.canGoBack() ? router.back() : router.replace('/(tabs)/tasks');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      AWAITING_APPROVAL: 'Awaiting Approval',
      COMPLETED: 'Completed',
      ERROR: 'Error',
    };
    return labels[status] || status;
  };

  const getStatusMessage = (status: string) => {
    const messages: Record<string, string> = {
      PENDING: 'This will mark the task as pending.',
      IN_PROGRESS: 'This will mark the task as in progress.',
      AWAITING_APPROVAL: 'This will submit the task for approval.',
      COMPLETED: 'This will mark the task as completed. Great job! 🎉',
      ERROR: 'This will mark the task as having an error.',
    };
    return messages[status] || 'Update the task status?';
  };

  const handleStatusChangeRequest = (newStatus: string) => {
    if (newStatus === task?.status) return;
    
    Alert.alert(
      `Change to "${getStatusLabel(newStatus)}"?`,
      getStatusMessage(newStatus),
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: newStatus === 'COMPLETED' ? 'Complete Task' : 'Update Status',
          style: newStatus === 'ERROR' ? 'destructive' : 'default',
          onPress: () => confirmStatusChange(newStatus),
        },
      ],
      { cancelable: true }
    );
  };

  const confirmStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await api.put(`/tasks/${params.id}`, { status: newStatus });
      loadTask();
      Alert.alert('Success', `Task status updated to ${getStatusLabel(newStatus)}! ${newStatus === 'COMPLETED' ? '🎉' : ''}`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update task status');
    } finally {
      setUpdatingStatus(false);
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
    return new Date(dueDate) < new Date() && task?.status !== 'COMPLETED';
  };

  const canUpdateStatus = () => {
    if (!task || !user) return false;
    return task.assignedTo.id === user.id || user.role === 'CA' || user.role === 'MANAGER';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tasks')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Details</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !task) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tasks')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Details</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Task not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTask}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const overdue = isOverdue(task.dueDate);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tasks')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTask} />}
      >
      <View style={styles.content}>
        {/* Title and Status */}
        <View style={styles.titleSection}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(task.status) }]}>
                {task.status.replace('_', ' ')}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
              <Text style={[styles.badgeText, { color: getPriorityColor(task.priority) }]}>
                {task.priority} Priority
              </Text>
            </View>
            {overdue && (
              <View style={[styles.badge, { backgroundColor: '#ef444420' }]}>
                <Text style={[styles.badgeText, { color: '#ef4444' }]}>Overdue</Text>
              </View>
            )}
          </View>

          {/* Edit/Delete Buttons */}
          {canEdit && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.editButton} onPress={openEditForm}>
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTask}>
                <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Edit Task Form */}
        {showEditForm && canEdit && (
          <View style={styles.editFormCard}>
            <Text style={styles.editFormTitle}>Edit Task</Text>
            <TextInput
              style={styles.input}
              placeholder="Task Title *"
              value={editFormData.title}
              onChangeText={(text) => setEditFormData({ ...editFormData, title: text })}
            />
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder="Description"
              multiline
              value={editFormData.description}
              onChangeText={(text) => setEditFormData({ ...editFormData, description: text })}
            />
            <View style={styles.prioritySelector}>
              <Text style={styles.priorityLabel}>Priority:</Text>
              {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityOption,
                    editFormData.priority === p && styles.priorityOptionActive,
                    { borderColor: getPriorityColor(p) },
                  ]}
                  onPress={() => setEditFormData({ ...editFormData, priority: p })}
                >
                  <Text style={[
                    styles.priorityOptionText,
                    editFormData.priority === p && { color: getPriorityColor(p), fontWeight: '600' },
                  ]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.editFormButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditForm(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleEditTask}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Status Update */}
        {canUpdateStatus() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            <View style={styles.statusButtons}>
              {['PENDING', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    task.status === status && styles.statusButtonActive,
                    { borderColor: getStatusColor(status) },
                  ]}
                  onPress={() => handleStatusChangeRequest(status)}
                  disabled={updatingStatus || task.status === status}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      task.status === status && { color: getStatusColor(status) },
                    ]}
                  >
                    {status.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {task.description || 'No description provided.'}
          </Text>
        </View>

        {/* Task Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Due Date:</Text>
            <Text style={styles.infoValue}>
              {format(new Date(task.dueDate), 'MMM dd, yyyy')}
              {overdue && <Text style={styles.overdueText}> (Overdue)</Text>}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned To:</Text>
            <Text style={styles.infoValue}>{task.assignedTo.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Firm:</Text>
            <Text style={styles.infoValue}>{task.firm.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client:</Text>
            <Text style={styles.infoValue}>{task.firm.client.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created By:</Text>
            <Text style={styles.infoValue}>{task.createdBy.name}</Text>
          </View>
          {task.completedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Completed On:</Text>
              <Text style={styles.infoValue}>
                {format(new Date(task.completedAt), 'MMM dd, yyyy')}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created On:</Text>
            <Text style={styles.infoValue}>
              {format(new Date(task.createdAt), 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents ({task.documents.length})</Text>
          {task.documents.length > 0 ? (
            task.documents.map((doc) => (
              <View key={doc.id} style={styles.documentCard}>
                <Text style={styles.documentName}>{doc.fileName}</Text>
                <Text style={styles.documentMeta}>
                  {doc.documentType} • {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No documents attached</Text>
          )}
        </View>

        {/* Approval Status */}
        {task.approval && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Approval Request</Text>
            <View style={[styles.badge, { backgroundColor: getStatusColor(task.approval.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(task.approval.status) }]}>
                {task.approval.status}
              </Text>
            </View>
            {task.approval.remarks && (
              <Text style={styles.description}>{task.approval.remarks}</Text>
            )}
            {task.approval.createdAt && (
              <Text style={styles.infoValue}>
                Requested on {format(new Date(task.approval.createdAt), 'MMM dd, yyyy')}
              </Text>
            )}
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#0f172a',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  titleSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  editButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  editFormCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  editFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  prioritySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
  },
  priorityOptionActive: {
    backgroundColor: '#f0f9ff',
  },
  priorityOptionText: {
    fontSize: 12,
    color: '#64748b',
  },
  editFormButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  overdueText: {
    color: '#ef4444',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'white',
  },
  statusButtonActive: {
    backgroundColor: '#f3f4f6',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  documentCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

