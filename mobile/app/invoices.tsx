import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
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
  firm: {
    id: number;
    name: string;
    client: { id: number; name: string };
  };
}

export default function InvoicesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firms, setFirms] = useState<Array<{ id: number; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: '' });
  const [formData, setFormData] = useState({
    firmId: '',
    amount: '',
    taxAmount: '',
    dueDate: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadInvoices();
    loadFirms();
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

  const loadFirms = async () => {
    try {
      const response = await api.get('/firms');
      setFirms(response.data);
    } catch (error) {
      console.error('Failed to load firms');
    }
  };

  const handleSubmit = async () => {
    if (!formData.firmId || !formData.amount || !formData.dueDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      await api.post('/invoices', {
        ...formData,
        amount: parseFloat(formData.amount),
        taxAmount: parseFloat(formData.taxAmount) || 0,
      });
      setShowForm(false);
      setFormData({ firmId: '', amount: '', taxAmount: '', dueDate: '' });
      loadInvoices();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create invoice');
    }
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UNPAID: '#fbbf24',
      PAID: '#10b981',
      OVERDUE: '#ef4444',
      PARTIAL: '#3b82f6',
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInvoices} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Invoices</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
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
          {['UNPAID', 'PAID', 'OVERDUE', 'PARTIAL'].map((status) => (
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

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Create Invoice</Text>
          <Text style={styles.label}>Firm *</Text>
          <View style={styles.picker}>
            {firms.map((firm) => (
              <TouchableOpacity
                key={firm.id}
                style={[styles.pickerOption, formData.firmId === String(firm.id) && styles.pickerOptionSelected]}
                onPress={() => setFormData({ ...formData, firmId: String(firm.id) })}
              >
                <Text style={formData.firmId === String(firm.id) ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                  {firm.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Amount *"
            value={formData.amount}
            onChangeText={(text) => setFormData({ ...formData, amount: text })}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Tax Amount"
            value={formData.taxAmount}
            onChangeText={(text) => setFormData({ ...formData, taxAmount: text })}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Due Date (YYYY-MM-DD) *"
            value={formData.dueDate}
            onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
          />
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowForm(false);
                setFormData({ firmId: '', amount: '', taxAmount: '', dueDate: '' });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.list}>
        {invoices.map((invoice) => (
          <TouchableOpacity
            key={invoice.id}
            style={styles.card}
            onPress={() => router.push(`/invoices/${invoice.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{invoice.invoiceNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
                <Text style={styles.statusBadgeText}>{invoice.status}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtext}>Firm: {invoice.firm.name}</Text>
            <Text style={styles.cardSubtext}>Client: {invoice.firm.client.name}</Text>
            <View style={styles.cardAmount}>
              <Text style={styles.amountLabel}>Amount:</Text>
              <Text style={styles.amountValue}>₹{invoice.amount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.cardAmount}>
              <Text style={styles.amountLabel}>Total:</Text>
              <Text style={styles.totalValue}>₹{invoice.totalAmount.toLocaleString('en-IN')}</Text>
            </View>
            <Text style={styles.dueDate}>Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</Text>
            {invoice.status !== 'PAID' && (
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => handlePay(invoice.id)}
              >
                <Text style={styles.payButtonText}>Mark as Paid</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        {invoices.length === 0 && <Text style={styles.emptyText}>No invoices found</Text>}
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
  cardAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  dueDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  payButton: {
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  payButtonText: {
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

