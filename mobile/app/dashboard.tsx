import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Linking, Modal } from 'react-native';
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
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  firm: {
    id: number;
    name: string;
    client: { id: number; name: string };
  };
  assignedTo: { id: number; name: string };
}

interface Deadline {
  id: number;
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
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingData, setMeetingData] = useState({
    title: '',
    date: '',
    time: '',
    clientId: '',
    firmId: '',
    location: '',
    notes: '',
  });
  const [clients, setClients] = useState<Array<{ id: number; name: string; email?: string }>>([]);
  const [firms, setFirms] = useState<Array<{ id: number; name: string; clientId: number }>>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submittingMeeting, setSubmittingMeeting] = useState(false);

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

  // Load clients and firms when meeting modal opens
  useEffect(() => {
    if (showMeetingModal) {
      loadClientsAndFirms();
    }
  }, [showMeetingModal]);

  const loadClientsAndFirms = async () => {
    setLoadingClients(true);
    try {
      const [clientsRes, firmsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/firms'),
      ]);
      setClients(clientsRes.data || []);
      setFirms(firmsRes.data || []);
    } catch (error) {
      console.error('Failed to load clients/firms:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleMeetingSubmit = async () => {
    if (!meetingData.title || !meetingData.date || !meetingData.time) {
      Alert.alert('Error', 'Title, date, and time are required');
      return;
    }

    setSubmittingMeeting(true);
    try {
      const response = await api.post('/meetings', {
        title: meetingData.title,
        description: meetingData.notes,
        clientId: meetingData.clientId || null,
        firmId: meetingData.firmId || null,
        date: meetingData.date,
        time: meetingData.time,
        location: meetingData.location || null,
        notes: meetingData.notes || null,
      });

      // Open Google Calendar link
      if (response.data.googleCalendarLink) {
        const supported = await Linking.canOpenURL(response.data.googleCalendarLink);
        if (supported) {
          await Linking.openURL(response.data.googleCalendarLink);
        }
      }

      Alert.alert('Success', 'Meeting scheduled successfully!');
      setMeetingData({ title: '', date: '', time: '', clientId: '', firmId: '', location: '', notes: '' });
      setShowMeetingModal(false);
    } catch (error: any) {
      console.error('Failed to create meeting:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to schedule meeting. Please try again.');
    } finally {
      setSubmittingMeeting(false);
    }
  };

  // Filter firms based on selected client
  const filteredFirms = meetingData.clientId
    ? firms.filter((firm) => firm.clientId === meetingData.clientId)
    : firms;

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
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Text style={styles.headerSubtitle}>
              {getCurrentGreeting()}, {user?.name}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setShowMeetingModal(true)} style={styles.scheduleButton}>
            <Text style={styles.scheduleButtonText}>Meeting</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
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
          {isCA && (
            <>
              <QuickAccessButton title="Users" onPress={() => router.push('/users')} color="#a855f7" />
              <QuickAccessButton title="Activity Logs" onPress={() => router.push('/activity-logs')} color="#ec4899" />
            </>
          )}
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

      {/* Schedule Meeting Modal */}
      <Modal
        visible={showMeetingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMeetingModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Meeting</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Meeting Title *"
              value={meetingData.title}
              onChangeText={(text) => setMeetingData({ ...meetingData, title: text })}
            />

            <Text style={styles.label}>Client (Optional)</Text>
            <ScrollView style={styles.picker} horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.pickerOption, !meetingData.clientId && styles.pickerOptionSelected]}
                onPress={() => setMeetingData({ ...meetingData, clientId: '', firmId: '' })}
              >
                <Text style={!meetingData.clientId ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                  None
                </Text>
              </TouchableOpacity>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={[styles.pickerOption, meetingData.clientId === client.id && styles.pickerOptionSelected]}
                  onPress={() => setMeetingData({ ...meetingData, clientId: client.id, firmId: '' })}
                >
                  <Text style={meetingData.clientId === client.id ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                    {client.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {meetingData.clientId && (
              <>
                <Text style={styles.label}>Firm (Optional)</Text>
                <ScrollView style={styles.picker} horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.pickerOption, !meetingData.firmId && styles.pickerOptionSelected]}
                    onPress={() => setMeetingData({ ...meetingData, firmId: '' })}
                  >
                    <Text style={!meetingData.firmId ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                      None
                    </Text>
                  </TouchableOpacity>
                  {filteredFirms.map((firm) => (
                    <TouchableOpacity
                      key={firm.id}
                      style={[styles.pickerOption, meetingData.firmId === firm.id && styles.pickerOptionSelected]}
                      onPress={() => setMeetingData({ ...meetingData, firmId: firm.id })}
                    >
                      <Text style={meetingData.firmId === firm.id ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                        {firm.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={meetingData.date}
                  onChangeText={(text) => setMeetingData({ ...meetingData, date: text })}
                />
              </View>
              <View style={styles.dateTimeItem}>
                <Text style={styles.label}>Time *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={meetingData.time}
                  onChangeText={(text) => setMeetingData({ ...meetingData, time: text })}
                />
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Location (Optional)"
              value={meetingData.location}
              onChangeText={(text) => setMeetingData({ ...meetingData, location: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes / Agenda"
              value={meetingData.notes}
              onChangeText={(text) => setMeetingData({ ...meetingData, notes: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitModalButton, submittingMeeting && styles.submitModalButtonDisabled]}
                onPress={handleMeetingSubmit}
                disabled={submittingMeeting}
              >
                <Text style={styles.modalButtonText}>
                  {submittingMeeting ? 'Scheduling...' : 'Schedule Meeting'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowMeetingModal(false);
                  setMeetingData({ title: '', date: '', time: '', clientId: '', firmId: '', location: '', notes: '' });
                }}
                disabled={submittingMeeting}
              >
                <Text style={[styles.modalButtonText, { color: '#6b7280' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  scheduleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0284c7',
    borderRadius: 6,
  },
  scheduleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  picker: {
    marginBottom: 16,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    backgroundColor: 'white',
  },
  pickerOptionSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  pickerOptionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeItem: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitModalButton: {
    backgroundColor: '#0284c7',
  },
  submitModalButtonDisabled: {
    opacity: 0.5,
  },
  cancelModalButton: {
    backgroundColor: '#e5e5e5',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
