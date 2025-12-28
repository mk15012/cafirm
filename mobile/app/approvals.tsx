import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Approval {
  id: string;
  status: string;
  remarks?: string;
  task: {
    id: string;
    title: string;
    firm: {
      id: string;
      name: string;
      client: { id: string; name: string };
    };
  };
  requestedBy: { id: string; name: string };
  approvedBy?: { id: string; name: string };
  createdAt: string;
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadApprovals();
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
      Alert.alert('Success', 'Approval request approved');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!selectedApproval || !remarks.trim()) {
      Alert.alert('Error', 'Remarks are required for rejection');
      return;
    }
    try {
      await api.put(`/approvals/${selectedApproval.id}/reject`, { remarks });
      setSelectedApproval(null);
      setActionType(null);
      setRemarks('');
      loadApprovals();
      Alert.alert('Success', 'Approval request rejected');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to reject');
    }
  };

  const canApprove = user?.role === 'CA' || user?.role === 'MANAGER';

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#fbbf24',
      APPROVED: '#10b981',
      REJECTED: '#ef4444',
    };
    return colors[status] || '#6b7280';
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadApprovals} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Approvals</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, filters.status === '' && styles.filterChipActive]}
            onPress={() => setFilters({ status: '' })}
          >
            <Text style={[styles.filterChipText, filters.status === '' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filters.status === status && styles.filterChipActive]}
              onPress={() => setFilters({ status })}
            >
              <Text style={[styles.filterChipText, filters.status === status && styles.filterChipTextActive]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Action Modal */}
      {selectedApproval && actionType && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </Text>
            <Text style={styles.modalSubtext}>Task: {selectedApproval.task.title}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={actionType === 'reject' ? 'Remarks *' : 'Remarks (optional)'}
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, actionType === 'approve' ? styles.approveButton : styles.rejectButton]}
                onPress={actionType === 'approve' ? handleApprove : handleReject}
              >
                <Text style={styles.modalButtonText}>
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setSelectedApproval(null);
                  setActionType(null);
                  setRemarks('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.list}>
        {approvals.map((approval) => (
          <View key={approval.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{approval.task.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(approval.status) }]}>
                <Text style={styles.statusBadgeText}>{approval.status}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtext}>Firm: {approval.task.firm.name}</Text>
            <Text style={styles.cardSubtext}>Client: {approval.task.firm.client.name}</Text>
            <Text style={styles.cardSubtext}>Requested by: {approval.requestedBy.name}</Text>
            {approval.approvedBy && (
              <Text style={styles.cardSubtext}>Approved by: {approval.approvedBy.name}</Text>
            )}
            {approval.remarks && <Text style={styles.remarks}>Remarks: {approval.remarks}</Text>}
            <Text style={styles.date}>Date: {format(new Date(approval.createdAt), 'MMM dd, yyyy')}</Text>
            {approval.status === 'PENDING' && canApprove && (
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => {
                    setSelectedApproval(approval);
                    setActionType('approve');
                  }}
                >
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => {
                    setSelectedApproval(approval);
                    setActionType('reject');
                  }}
                >
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
        {approvals.length === 0 && <Text style={styles.emptyText}>No approvals found</Text>}
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
  filters: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
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
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  cancelModalButton: {
    backgroundColor: '#e5e5e5',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  remarks: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontStyle: 'italic',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
  },
});

