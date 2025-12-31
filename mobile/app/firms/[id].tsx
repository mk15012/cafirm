import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo: {
    id: number;
    name: string;
  };
}

interface Document {
  id: number;
  fileName: string;
  documentType: string;
  createdAt: string;
}

interface Invoice {
  id: number;
  amount: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

interface Firm {
  id: number;
  name: string;
  panNumber: string;
  gstNumber?: string;
  registrationNumber?: string;
  address?: string;
  status: string;
  createdAt: string;
  client: {
    id: number;
    name: string;
  };
  tasks: Task[];
  documents: Document[];
  invoices: Invoice[];
  _count: {
    tasks: number;
    documents: number;
    invoices: number;
  };
}

export default function FirmDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [firm, setFirm] = useState<Firm | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && params.id) {
      loadFirm();
    }
  }, [params.id, isAuthenticated]);

  const loadFirm = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/firms/${params.id}`);
      setFirm(response.data);
    } catch (error: any) {
      console.error('Failed to load firm:', error);
      setError(error.response?.data?.error || 'Failed to load firm');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? '#10b981' : '#6b7280';
  };

  const getTaskStatusColor = (status: string) => {
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

  const getInvoiceStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UNPAID: '#fbbf24',
      PAID: '#10b981',
      OVERDUE: '#ef4444',
      PARTIAL: '#3b82f6',
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/firms')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Firm Details</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Loading firm...</Text>
        </View>
      </View>
    );
  }

  if (error || !firm) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/firms')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Firm Details</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Firm</Text>
          <Text style={styles.errorText}>{error || 'Firm not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFirm}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFirm} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/firms')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Firm Details</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Firm Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.firmName}>{firm.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(firm.status) }]}>
            <Text style={styles.statusBadgeText}>{firm.status}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push(`/clients/${firm.client.id}`)}>
          <Text style={styles.clientLink}>Client: {firm.client.name}</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>PAN Number</Text>
          <Text style={styles.infoValue}>{firm.panNumber}</Text>
        </View>
        {firm.gstNumber && (
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>GST Number</Text>
            <Text style={styles.infoValue}>{firm.gstNumber}</Text>
          </View>
        )}
        {firm.registrationNumber && (
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Registration Number</Text>
            <Text style={styles.infoValue}>{firm.registrationNumber}</Text>
          </View>
        )}
        {firm.address && (
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{firm.address}</Text>
          </View>
        )}
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Created On</Text>
          <Text style={styles.infoValue}>{format(new Date(firm.createdAt), 'MMM dd, yyyy')}</Text>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push(`/tasks?firmId=${firm.id}`)}
        >
          <Text style={styles.statValue}>{firm._count.tasks}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push(`/documents?firmId=${firm.id}`)}
        >
          <Text style={styles.statValue}>{firm._count.documents}</Text>
          <Text style={styles.statLabel}>Documents</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push(`/invoices?firmId=${firm.id}`)}
        >
          <Text style={styles.statValue}>{firm._count.invoices}</Text>
          <Text style={styles.statLabel}>Invoices</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Tasks */}
      {firm.tasks.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Tasks</Text>
            <TouchableOpacity onPress={() => router.push(`/tasks?firmId=${firm.id}`)}>
              <Text style={styles.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          {firm.tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => router.push(`/tasks/${task.id}`)}
            >
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskSubtext}>Assigned to: {task.assignedTo.name}</Text>
              <Text style={styles.taskSubtext}>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</Text>
              <View style={styles.taskFooter}>
                <View style={[styles.statusBadge, { backgroundColor: getTaskStatusColor(task.status) }]}>
                  <Text style={styles.statusBadgeText}>{task.status.replace('_', ' ')}</Text>
                </View>
                <Text style={styles.priorityText}>{task.priority}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Documents */}
      {firm.documents.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Documents</Text>
            <TouchableOpacity onPress={() => router.push(`/documents?firmId=${firm.id}`)}>
              <Text style={styles.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          {firm.documents.map((doc) => (
            <View key={doc.id} style={styles.documentCard}>
              <Text style={styles.documentName}>{doc.fileName}</Text>
              <Text style={styles.documentType}>{doc.documentType}</Text>
              <Text style={styles.documentDate}>{format(new Date(doc.createdAt), 'MMM dd, yyyy')}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Invoices */}
      {firm.invoices.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            <TouchableOpacity onPress={() => router.push(`/invoices?firmId=${firm.id}`)}>
              <Text style={styles.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          {firm.invoices.map((invoice) => (
            <TouchableOpacity
              key={invoice.id}
              style={styles.invoiceCard}
              onPress={() => router.push(`/invoices/${invoice.id}`)}
            >
              <Text style={styles.invoiceAmount}>₹{invoice.totalAmount.toLocaleString('en-IN')}</Text>
              <Text style={styles.invoiceDue}>Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getInvoiceStatusColor(invoice.status) }]}>
                <Text style={styles.statusBadgeText}>{invoice.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty State */}
      {firm.tasks.length === 0 && firm.documents.length === 0 && firm.invoices.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Activity Yet</Text>
          <Text style={styles.emptyText}>This firm doesn't have any tasks, documents, or invoices yet.</Text>
        </View>
      )}
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
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: '#0284c7',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
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
    marginBottom: 12,
  },
  firmName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  clientLink: {
    fontSize: 16,
    color: '#0284c7',
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewAll: {
    fontSize: 14,
    color: '#0284c7',
    fontWeight: '500',
  },
  taskCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
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
    marginTop: 8,
  },
  priorityText: {
    fontSize: 12,
    color: '#6b7280',
  },
  documentCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  invoiceCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  invoiceDue: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

