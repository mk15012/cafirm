import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Invoice {
  id: number;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  paidDate?: string;
  paymentReference?: string;
  createdAt: string;
  firm: {
    id: number;
    name: string;
    client: {
      id: number;
      name: string;
    };
  };
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
}

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    if (params.id) {
      loadInvoice();
    }
  }, [params.id, isAuthenticated]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/invoices/${params.id}`);
      setInvoice(response.data);
    } catch (error: any) {
      console.error('Failed to load invoice:', error);
      setError(error.response?.data?.error || 'Failed to load invoice');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkPaid = async () => {
    Alert.alert('Confirm', 'Mark this invoice as paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Paid',
        onPress: async () => {
          try {
            setMarkingPaid(true);
            await api.put(`/invoices/${params.id}/pay`, {});
            loadInvoice();
            Alert.alert('Success', 'Invoice marked as paid successfully');
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to mark as paid');
          } finally {
            setMarkingPaid(false);
          }
        },
      },
    ]);
  };

  const handleSendInvoice = async () => {
    if (!invoice) return;
    const recipientEmail = invoice.firm.client.email || 'client';
    Alert.alert('Send Invoice', `Send invoice to ${recipientEmail}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          try {
            setSendingInvoice(true);
            const response = await api.post(`/invoices/${params.id}/send`, {});
            Alert.alert('Success', `Invoice sent successfully to ${response.data.sentTo}`);
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to send invoice');
          } finally {
            setSendingInvoice(false);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UNPAID: '#fbbf24',
      PAID: '#10b981',
      OVERDUE: '#ef4444',
      PARTIAL: '#3b82f6',
    };
    return colors[status] || '#6b7280';
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'PAID';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Invoice Details</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Loading invoice...</Text>
        </View>
      </View>
    );
  }

  if (error || !invoice) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Invoice Details</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Invoice</Text>
          <Text style={styles.errorText}>{error || 'Invoice not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadInvoice}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const overdue = isOverdue(invoice.dueDate, invoice.status);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInvoice} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Invoice Details</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Invoice Header */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.invoiceNumber}>Invoice #{invoice.invoiceNumber}</Text>
            <Text style={styles.createdDate}>Created on {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
            <Text style={styles.statusBadgeText}>{invoice.status}</Text>
          </View>
        </View>

        {overdue && (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>⚠️ Invoice is Overdue</Text>
            <Text style={styles.alertText}>Due date was {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.sendButton, (!invoice.firm.client.email || sendingInvoice) && styles.disabledButton]}
            onPress={handleSendInvoice}
            disabled={!invoice.firm.client.email || sendingInvoice}
          >
            <Text style={styles.actionButtonText}>{sendingInvoice ? 'Sending...' : 'Send Invoice'}</Text>
          </TouchableOpacity>
          {invoice.status !== 'PAID' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.payButton, markingPaid && styles.disabledButton]}
              onPress={handleMarkPaid}
              disabled={markingPaid}
            >
              <Text style={styles.actionButtonText}>{markingPaid ? 'Marking...' : 'Mark as Paid'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bill To */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bill To</Text>
        <TouchableOpacity onPress={() => router.push(`/firms/${invoice.firm.id}`)}>
          <Text style={styles.firmName}>{invoice.firm.name}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/clients/${invoice.firm.client.id}`)}>
          <Text style={styles.clientName}>Client: {invoice.firm.client.name}</Text>
        </TouchableOpacity>
      </View>

      {/* Invoice Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Invoice Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Due Date</Text>
          <Text style={[styles.detailValue, overdue && styles.overdueText]}>
            {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
            {overdue && ' (Overdue)'}
          </Text>
        </View>
        {invoice.paidDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid Date</Text>
            <Text style={styles.detailValue}>{format(new Date(invoice.paidDate), 'MMM dd, yyyy')}</Text>
          </View>
        )}
        {invoice.paymentReference && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Reference</Text>
            <Text style={styles.detailValue}>{invoice.paymentReference}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created By</Text>
          <Text style={styles.detailValue}>{invoice.createdBy.name}</Text>
        </View>
      </View>

      {/* Amount Breakdown */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Amount Breakdown</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Service Amount</Text>
          <Text style={styles.amountValue}>₹{invoice.amount.toLocaleString('en-IN')}</Text>
        </View>
        {invoice.taxAmount > 0 && (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Tax (GST)</Text>
            <Text style={styles.amountValue}>₹{invoice.taxAmount.toLocaleString('en-IN')}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{invoice.totalAmount.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Payment Status */}
      {invoice.status === 'PAID' && (
        <View style={[styles.card, styles.successCard]}>
          <Text style={styles.successTitle}>✓ Payment Received</Text>
          <Text style={styles.successText}>
            This invoice was marked as paid on {format(new Date(invoice.paidDate!), 'MMM dd, yyyy')}
          </Text>
        </View>
      )}

      {invoice.status === 'UNPAID' && (
        <View style={[styles.card, styles.warningCard]}>
          <Text style={styles.warningTitle}>⚠ Payment Pending</Text>
          <Text style={styles.warningText}>
            This invoice is awaiting payment. Due date: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
          </Text>
        </View>
      )}

      {invoice.status === 'OVERDUE' && (
        <View style={[styles.card, styles.errorCard]}>
          <Text style={styles.errorTitle}>⚠ Payment Overdue</Text>
          <Text style={styles.errorText}>
            This invoice is past its due date. Please follow up with the client for payment.
          </Text>
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  invoiceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  createdDate: {
    fontSize: 14,
    color: '#6b7280',
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
  alertBox: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#78350f',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#0284c7',
  },
  payButton: {
    backgroundColor: '#10b981',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  firmName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0284c7',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    color: '#0284c7',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  overdueText: {
    color: '#ef4444',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginTop: 8,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  successCard: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 1,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: '#047857',
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
    borderWidth: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#78350f',
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
  },
});

