import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Approval {
  id: number;
  status: string;
  remarks?: string;
  task: {
    id: number;
    title: string;
    firm: { id: number; name: string; client: { id: number; name: string } };
  };
  requestedBy: { id: number; name: string };
  approvedBy?: { id: number; name: string };
  createdAt: string;
  approvedAt?: string;
}

export default function ApprovalsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ status: '' });
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState('');

  const canApprove = user?.role === 'CA' || user?.role === 'MANAGER';

  useEffect(() => {
    if (isAuthenticated) {
      loadApprovals();
    }
  }, [isAuthenticated, filters]);

  const loadApprovals = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      const response = await api.get(`/approvals?${params.toString()}`);
      setApprovals(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load approvals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;
    try {
      await api.put(`/approvals/${selectedApproval.id}/approve`, { remarks });
      setSelectedApproval(null);
      setActionType(null);
      setRemarks('');
      loadApprovals();
      Alert.alert('Success', 'Approval granted');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;
    if (!remarks.trim()) {
      Alert.alert('Error', 'Remarks are required for rejection');
      return;
    }
    try {
      await api.put(`/approvals/${selectedApproval.id}/reject`, { remarks });
      setSelectedApproval(null);
      setActionType(null);
      setRemarks('');
      loadApprovals();
      Alert.alert('Success', 'Approval rejected');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to reject');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { PENDING: '#fbbf24', APPROVED: '#10b981', REJECTED: '#ef4444' };
    return colors[status] || '#6b7280';
  };

  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;

  if (!isAuthenticated || loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading approvals...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadApprovals} colors={['#0ea5e9']} />}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Approvals</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Pending Alert */}
        {pendingCount > 0 && canApprove && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>⏳ {pendingCount} pending approval{pendingCount > 1 ? 's' : ''}</Text>
          </View>
        )}

        {/* Filters */}
        <View style={styles.filters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
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
          {approvals.map((approval) => (
            <View key={approval.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{approval.task.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(approval.status) }]}>
                  <Text style={styles.statusBadgeText}>{approval.status}</Text>
                </View>
              </View>
              <Text style={styles.cardSubtext}>🏢 {approval.task.firm.name}</Text>
              <Text style={styles.cardSubtext}>👤 Requested by: {approval.requestedBy.name}</Text>
              <Text style={styles.cardSubtext}>📅 {format(new Date(approval.createdAt), 'MMM dd, yyyy')}</Text>
              {approval.remarks && <Text style={styles.remarksText}>💬 {approval.remarks}</Text>}
              
              {approval.status === 'PENDING' && canApprove && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => { setSelectedApproval(approval); setActionType('approve'); }}
                  >
                    <Text style={styles.approveButtonText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => { setSelectedApproval(approval); setActionType('reject'); }}
                  >
                    <Text style={styles.rejectButtonText}>✗ Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          {approvals.length === 0 && <Text style={styles.emptyText}>No approvals found</Text>}
        </View>
      </ScrollView>

      {/* Action Modal */}
      <Modal visible={!!selectedApproval && !!actionType} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'approve' ? '✓ Approve Request' : '✗ Reject Request'}
            </Text>
            <Text style={styles.modalSubtitle}>{selectedApproval?.task.title}</Text>
            <TextInput
              style={styles.remarksInput}
              placeholder={actionType === 'approve' ? 'Optional remarks...' : 'Required remarks...'}
              placeholderTextColor="#9ca3af"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, actionType === 'approve' ? styles.approveButton : styles.rejectButton]}
                onPress={actionType === 'approve' ? handleApprove : handleReject}
              >
                <Text style={styles.modalButtonText}>{actionType === 'approve' ? 'Approve' : 'Reject'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => { setSelectedApproval(null); setActionType(null); setRemarks(''); }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
  alertBanner: { backgroundColor: '#fef3c7', padding: 12, margin: 16, marginBottom: 0, borderRadius: 8, borderWidth: 1, borderColor: '#fcd34d' },
  alertText: { color: '#92400e', fontSize: 14, fontWeight: '600' },
  filters: { padding: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
  filterChipActive: { backgroundColor: '#0ea5e9' },
  filterChipText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: 'white' },
  list: { padding: 16, paddingTop: 0 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1, color: '#0f172a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  cardSubtext: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  remarksText: { fontSize: 13, color: '#64748b', fontStyle: 'italic', marginTop: 8, padding: 8, backgroundColor: '#f8fafc', borderRadius: 6 },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  approveButton: { flex: 1, backgroundColor: '#10b981', padding: 12, borderRadius: 8, alignItems: 'center' },
  approveButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  rejectButton: { flex: 1, backgroundColor: '#ef4444', padding: 12, borderRadius: 8, alignItems: 'center' },
  rejectButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  remarksInput: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 14, fontSize: 16, color: '#0f172a', minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelButton: { flex: 1, backgroundColor: '#f1f5f9', padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
});
