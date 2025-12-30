import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
  createdAt: string;
  firm: { id: number; name: string; client: { id: number; name: string; email?: string } };
  createdBy: { id: number; name: string; email: string };
}

export default function InvoicesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadInvoices();
  }, [isAuthenticated, filters]);

  const loadInvoices = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      const response = await api.get(`/invoices?${params.toString()}`);
      setInvoices(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load invoices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { UNPAID: '#fbbf24', PAID: '#10b981', OVERDUE: '#ef4444', PARTIAL: '#3b82f6' };
    return colors[status] || '#6b7280';
  };

  const handlePay = async (id: number) => {
    Alert.alert('Confirm', 'Mark this invoice as paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Paid',
        onPress: async () => {
          try {
            await api.put(`/invoices/${id}/pay`, {});
            loadInvoices();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to mark as paid');
          }
        },
      },
    ]);
  };

  const handleSendInvoice = (invoice: Invoice) => {
    const clientEmail = invoice.firm.client.email;
    if (!clientEmail) {
      Alert.alert('Missing Email', 'Client email not found. Please add email to the client profile first.');
      return;
    }

    // Format currency
    const formatCurrency = (amount: number) => '₹' + amount.toLocaleString('en-IN');
    
    // Format date
    const formatDueDate = (date: string) => format(new Date(date), 'MMMM dd, yyyy');

    // Create email subject
    const subject = `Invoice #${invoice.invoiceNumber} - Amount Due: ${formatCurrency(invoice.totalAmount)}`;
    
    // Create email body
    const body = `Dear ${invoice.firm.client.name},

Please find below the invoice details for services rendered to ${invoice.firm.name}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVOICE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice Number: #${invoice.invoiceNumber}
Firm Name: ${invoice.firm.name}
Invoice Date: ${format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AMOUNT BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Service Amount: ${formatCurrency(invoice.amount)}
Tax (GST): ${formatCurrency(invoice.taxAmount)}
─────────────────────────────────────────
TOTAL AMOUNT DUE: ${formatCurrency(invoice.totalAmount)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT DUE DATE: ${formatDueDate(invoice.dueDate)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please make the payment by the due date mentioned above.

If you have any questions regarding this invoice, please feel free to contact us.

Thank you for your business!

Best regards,
${invoice.createdBy.name}
${invoice.createdBy.email}`;

    // Create mailto link and open it
    const mailtoLink = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailtoLink);
  };

  if (!isAuthenticated || loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading invoices...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInvoices} colors={['#0ea5e9']} />}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Invoices</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['', 'UNPAID', 'PAID', 'OVERDUE', 'PARTIAL'].map((status) => (
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
          {invoices.map((invoice) => (
            <TouchableOpacity key={invoice.id} style={styles.card} onPress={() => router.push(`/invoices/${invoice.id}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{invoice.invoiceNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
                  <Text style={styles.statusBadgeText}>{invoice.status}</Text>
                </View>
              </View>
              <Text style={styles.cardSubtext}>Firm: {invoice.firm.name}</Text>
              <Text style={styles.cardSubtext}>Client: {invoice.firm.client.name}</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Total:</Text>
                <Text style={styles.totalValue}>₹{invoice.totalAmount.toLocaleString('en-IN')}</Text>
              </View>
              <Text style={styles.dueDate}>Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.sendButton, !invoice.firm.client.email && styles.disabledButton]} 
                  onPress={() => handleSendInvoice(invoice)}
                  disabled={!invoice.firm.client.email}
                >
                  <Text style={styles.sendButtonText}>📧 Send Invoice</Text>
                </TouchableOpacity>
                {invoice.status !== 'PAID' && (
                  <TouchableOpacity style={styles.payButton} onPress={() => handlePay(invoice.id)}>
                    <Text style={styles.payButtonText}>✓ Mark Paid</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
          {invoices.length === 0 && <Text style={styles.emptyText}>No invoices found</Text>}
        </View>
      </ScrollView>
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
  filters: { backgroundColor: 'white', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
  filterChipActive: { backgroundColor: '#0ea5e9' },
  filterChipText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: 'white' },
  list: { padding: 16 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', flex: 1, color: '#0f172a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  cardSubtext: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  amountLabel: { fontSize: 14, color: '#64748b' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#0ea5e9' },
  dueDate: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 12 },
  sendButton: { flex: 1, backgroundColor: '#0ea5e9', padding: 12, borderRadius: 8, alignItems: 'center' },
  sendButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  payButton: { flex: 1, backgroundColor: '#10b981', padding: 12, borderRadius: 8, alignItems: 'center' },
  payButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  disabledButton: { backgroundColor: '#94a3b8', opacity: 0.6 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 32 },
});
