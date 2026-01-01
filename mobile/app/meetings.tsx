import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, TextInput, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Meeting {
  id: number;
  title: string;
  description?: string;
  meetingDate: string;
  meetingTime: string;
  status: string;
  client?: { id: number; name: string };
  firm?: { id: number; name: string };
  createdBy: { id: number; name: string };
}

interface Client {
  id: number;
  name: string;
}

interface Firm {
  id: number;
  name: string;
  clientId: number;
}

export default function MeetingsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    firmId: '',
    meetingDate: '',
    meetingTime: '',
  });

  const isCA = user?.role === 'CA';
  const isManager = user?.role === 'MANAGER';
  const canSchedule = isCA || isManager;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [meetingsRes, clientsRes, firmsRes] = await Promise.all([
        api.get('/meetings'),
        api.get('/clients'),
        api.get('/firms'),
      ]);
      setMeetings(meetingsRes.data);
      setClients(clientsRes.data);
      setFirms(firmsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredFirms = formData.clientId
    ? firms.filter(f => f.clientId === parseInt(formData.clientId))
    : firms;

  const handleSubmit = async () => {
    if (!formData.title || !formData.meetingDate || !formData.meetingTime) {
      const msg = 'Please fill in title, date, and time';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/meetings', {
        title: formData.title,
        description: formData.description || undefined,
        clientId: formData.clientId ? parseInt(formData.clientId) : undefined,
        firmId: formData.firmId ? parseInt(formData.firmId) : undefined,
        meetingDate: formData.meetingDate,
        meetingTime: formData.meetingTime,
      });

      const successMsg = 'Meeting scheduled successfully!';
      if (Platform.OS === 'web') {
        window.alert(successMsg);
      } else {
        Alert.alert('Success', successMsg);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to schedule meeting';
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      clientId: '',
      firmId: '',
      meetingDate: '',
      meetingTime: '',
    });
  };

  const handleCancel = async (id: number) => {
    const confirmCancel = () => {
      api.put(`/meetings/${id}/cancel`)
        .then(() => {
          if (Platform.OS === 'web') {
            window.alert('Meeting cancelled');
          } else {
            Alert.alert('Success', 'Meeting cancelled');
          }
          loadData();
        })
        .catch((error: any) => {
          const msg = error.response?.data?.error || 'Failed to cancel meeting';
          if (Platform.OS === 'web') {
            window.alert(msg);
          } else {
            Alert.alert('Error', msg);
          }
        });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to cancel this meeting?')) {
        confirmCancel();
      }
    } else {
      Alert.alert(
        'Cancel Meeting',
        'Are you sure you want to cancel this meeting?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: confirmCancel },
        ]
      );
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: '#3b82f6',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const formatMeetingDateTime = (date: string, time: string) => {
    try {
      const formattedDate = format(new Date(date), 'MMM dd, yyyy');
      return `${formattedDate} at ${time}`;
    } catch {
      return `${date} at ${time}`;
    }
  };

  const upcomingMeetings = meetings.filter(m => m.status === 'SCHEDULED');
  const pastMeetings = meetings.filter(m => m.status !== 'SCHEDULED');

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading meetings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={['#0ea5e9']} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Meetings</Text>
          {canSchedule ? (
            <TouchableOpacity onPress={() => setShowModal(true)}>
              <Text style={styles.addButton}>+ New</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* Upcoming Meetings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Upcoming ({upcomingMeetings.length})</Text>
          {upcomingMeetings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No upcoming meetings</Text>
            </View>
          ) : (
            upcomingMeetings.map((meeting) => (
              <View key={meeting.id} style={styles.meetingCard}>
                <View style={styles.meetingHeader}>
                  <Text style={styles.meetingTitle}>{meeting.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(meeting.status) }]}>
                    <Text style={styles.statusText}>{meeting.status}</Text>
                  </View>
                </View>
                <Text style={styles.meetingDateTime}>
                  🕐 {formatMeetingDateTime(meeting.meetingDate, meeting.meetingTime)}
                </Text>
                {meeting.client && (
                  <Text style={styles.meetingDetail}>👤 {meeting.client.name}</Text>
                )}
                {meeting.firm && (
                  <Text style={styles.meetingDetail}>🏢 {meeting.firm.name}</Text>
                )}
                {meeting.description && (
                  <Text style={styles.meetingDescription}>{meeting.description}</Text>
                )}
                {canSchedule && (
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => handleCancel(meeting.id)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Meeting</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Past Meetings */}
        {pastMeetings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Past Meetings ({pastMeetings.length})</Text>
            {pastMeetings.map((meeting) => (
              <View key={meeting.id} style={[styles.meetingCard, styles.pastMeetingCard]}>
                <View style={styles.meetingHeader}>
                  <Text style={[styles.meetingTitle, styles.pastMeetingTitle]}>{meeting.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(meeting.status) }]}>
                    <Text style={styles.statusText}>{meeting.status}</Text>
                  </View>
                </View>
                <Text style={styles.meetingDateTime}>
                  🕐 {formatMeetingDateTime(meeting.meetingDate, meeting.meetingTime)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Schedule Meeting Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Meeting</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Meeting title"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Client (Optional)</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value, firmId: '' })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Client" value="" />
                  {clients.map((client) => (
                    <Picker.Item key={client.id} label={client.name} value={client.id.toString()} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Firm (Optional)</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.firmId}
                  onValueChange={(value) => setFormData({ ...formData, firmId: value })}
                  style={styles.picker}
                  enabled={filteredFirms.length > 0}
                >
                  <Picker.Item label={filteredFirms.length === 0 ? "No firms available" : "Select Firm"} value="" />
                  {filteredFirms.map((firm) => (
                    <Picker.Item key={firm.id} label={firm.name} value={firm.id.toString()} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={formData.meetingDate}
                onChangeText={(text) => setFormData({ ...formData, meetingDate: text })}
                placeholder="2025-01-15"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Time * (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={formData.meetingTime}
                onChangeText={(text) => setFormData({ ...formData, meetingTime: text })}
                placeholder="10:30"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Meeting description"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Scheduling...' : 'Schedule Meeting'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => { setShowModal(false); resetForm(); }}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
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

  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },

  emptyCard: { backgroundColor: 'white', padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },

  meetingCard: { 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pastMeetingCard: { opacity: 0.7 },
  meetingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  meetingTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
  pastMeetingTitle: { color: '#64748b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: 'white', fontSize: 10, fontWeight: '600' },
  meetingDateTime: { fontSize: 14, color: '#0ea5e9', fontWeight: '500', marginBottom: 4 },
  meetingDetail: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  meetingDescription: { fontSize: 13, color: '#64748b', marginTop: 8, fontStyle: 'italic' },
  cancelButton: { marginTop: 12, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444', alignItems: 'center' },
  cancelButtonText: { color: '#ef4444', fontSize: 14, fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  closeButton: { fontSize: 20, color: '#64748b', padding: 4 },
  modalBody: { padding: 16 },
  modalFooter: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },

  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, color: '#0f172a' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' },
  picker: { height: 50 },

  submitButton: { flex: 1, backgroundColor: '#0ea5e9', padding: 14, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  cancelModalButton: { flex: 1, backgroundColor: '#f1f5f9', padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelModalButtonText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
});

