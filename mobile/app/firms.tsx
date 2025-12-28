import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Firm {
  id: string;
  name: string;
  panNumber: string;
  gstNumber?: string;
  status: string;
  client: { id: string; name: string };
  _count: {
    tasks: number;
    documents: number;
    invoices: number;
  };
}

export default function FirmsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    panNumber: '',
    gstNumber: '',
    registrationNumber: '',
    address: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadFirms();
    loadClients();
  }, [isAuthenticated]);

  const loadFirms = async () => {
    try {
      const response = await api.get('/firms');
      setFirms(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load firms');
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
      console.error('Failed to load clients');
    }
  };

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.name || !formData.panNumber) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      await api.post('/firms', formData);
      setShowForm(false);
      setFormData({ clientId: '', name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
      loadFirms();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create firm');
    }
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFirms} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Firms</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Add New Firm</Text>
          <Text style={styles.label}>Client *</Text>
          <View style={styles.picker}>
            {clients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={[styles.pickerOption, formData.clientId === client.id && styles.pickerOptionSelected]}
                onPress={() => setFormData({ ...formData, clientId: client.id })}
              >
                <Text style={formData.clientId === client.id ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                  {client.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Firm Name *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="PAN Number *"
            value={formData.panNumber}
            onChangeText={(text) => setFormData({ ...formData, panNumber: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="GST Number"
            value={formData.gstNumber}
            onChangeText={(text) => setFormData({ ...formData, gstNumber: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Registration Number"
            value={formData.registrationNumber}
            onChangeText={(text) => setFormData({ ...formData, registrationNumber: text })}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Address"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            multiline
            numberOfLines={3}
          />
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowForm(false);
                setFormData({ clientId: '', name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.list}>
        {firms.map((firm) => (
          <TouchableOpacity
            key={firm.id}
            style={styles.card}
            onPress={() => router.push(`/firms/${firm.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{firm.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: firm.status === 'Active' ? '#10b981' : '#6b7280' }]}>
                <Text style={styles.statusBadgeText}>{firm.status}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtext}>Client: {firm.client.name}</Text>
            <Text style={styles.cardSubtext}>PAN: {firm.panNumber}</Text>
            {firm.gstNumber && <Text style={styles.cardSubtext}>GST: {firm.gstNumber}</Text>}
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Tasks: {firm._count.tasks}</Text>
              <Text style={styles.cardFooterText}>Docs: {firm._count.documents}</Text>
              <Text style={styles.cardFooterText}>Invoices: {firm._count.invoices}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {firms.length === 0 && <Text style={styles.emptyText}>No firms found</Text>}
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  cardFooterText: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
  },
});

