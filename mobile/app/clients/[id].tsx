import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Firm {
  id: number;
  name: string;
  panNumber: string;
  gstNumber?: string;
  status: string;
  _count: {
    tasks: number;
    documents: number;
    invoices: number;
  };
}

interface Client {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  firms: Firm[];
}

export default function ClientDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFirmForm, setShowFirmForm] = useState(false);
  const [firmFormData, setFirmFormData] = useState({
    name: '',
    panNumber: '',
    gstNumber: '',
    registrationNumber: '',
    address: '',
  });

  const isCA = user?.role === 'CA';

  useEffect(() => {
    if (isAuthenticated && params.id) {
      loadClient();
    }
  }, [params.id, isAuthenticated]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clients/${params.id}`);
      setClient(response.data);
    } catch (error: any) {
      console.error('Failed to load client:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load client');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateFirm = async () => {
    try {
      await api.post('/firms', {
        ...firmFormData,
        clientId: params.id,
      });
      setShowFirmForm(false);
      setFirmFormData({ name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
      loadClient();
      Alert.alert('Success', 'Firm created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create firm');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/clients')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Client Details</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading client...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/clients')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Client Details</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Client not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/clients')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Details</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadClient} />}
      >

      <View style={styles.content}>
        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.clientName}>{client.name}</Text>
          {client.contactPerson && (
            <Text style={styles.contactPerson}>{client.contactPerson}</Text>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {client.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{client.email}</Text>
            </View>
          )}
          {client.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{client.phone}</Text>
            </View>
          )}
          {client.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{client.address}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {client.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.description}>{client.notes}</Text>
          </View>
        )}

        {/* Firms */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Firms ({client.firms.length})</Text>
            {isCA && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowFirmForm(!showFirmForm)}
              >
                <Text style={styles.addButtonText}>+ Add Firm</Text>
              </TouchableOpacity>
            )}
          </View>

          {showFirmForm && isCA && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Add New Firm</Text>
              <TextInput
                style={styles.input}
                placeholder="Firm Name *"
                value={firmFormData.name}
                onChangeText={(text) => setFirmFormData({ ...firmFormData, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="PAN Number *"
                value={firmFormData.panNumber}
                onChangeText={(text) => setFirmFormData({ ...firmFormData, panNumber: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="GST Number"
                value={firmFormData.gstNumber}
                onChangeText={(text) => setFirmFormData({ ...firmFormData, gstNumber: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Registration Number"
                value={firmFormData.registrationNumber}
                onChangeText={(text) => setFirmFormData({ ...firmFormData, registrationNumber: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={firmFormData.address}
                onChangeText={(text) => setFirmFormData({ ...firmFormData, address: text })}
                multiline
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCreateFirm}
                >
                  <Text style={styles.submitButtonText}>Create Firm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowFirmForm(false);
                    setFirmFormData({ name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {client.firms.length > 0 ? (
            client.firms.map((firm) => (
              <TouchableOpacity
                key={firm.id}
                style={styles.firmCard}
                onPress={() => router.push(`/firms/${firm.id}`)}
              >
                <Text style={styles.firmName}>{firm.name}</Text>
                <Text style={styles.firmInfo}>PAN: {firm.panNumber}</Text>
                {firm.gstNumber && (
                  <Text style={styles.firmInfo}>GST: {firm.gstNumber}</Text>
                )}
                <View style={styles.firmStats}>
                  <Text style={styles.firmStat}>
                    {firm._count.tasks} {firm._count.tasks === 1 ? 'Task' : 'Tasks'}
                  </Text>
                  <Text style={styles.firmStat}>
                    {firm._count.documents} {firm._count.documents === 1 ? 'Document' : 'Documents'}
                  </Text>
                  <Text style={styles.firmStat}>
                    {firm._count.invoices} {firm._count.invoices === 1 ? 'Invoice' : 'Invoices'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No firms found</Text>
          )}
        </View>
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
    color: '#64748b',
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
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  clientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  contactPerson: {
    fontSize: 16,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  addButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
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
  firmCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  firmName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  firmInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  firmStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  firmStat: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

