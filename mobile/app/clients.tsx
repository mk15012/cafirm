import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Client {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  _count: { firms: number };
}

export default function ClientsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const isCA = user?.role === 'CA';
  const [formData, setFormData] = useState({ name: '', contactPerson: '', email: '', phone: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadClients();
  }, [isAuthenticated]);

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    try {
      await api.post('/clients', formData);
      setShowForm(false);
      setFormData({ name: '', contactPerson: '', email: '', phone: '' });
      loadClients();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create client');
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading clients...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadClients} colors={['#0ea5e9']} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Clients</Text>
          {isCA && (
            <TouchableOpacity onPress={() => setShowForm(!showForm)}>
              <Text style={styles.addButton}>{showForm ? 'Cancel' : '+ Add'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Add New Client</Text>
            <TextInput style={styles.input} placeholder="Name *" placeholderTextColor="#9ca3af" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
            <TextInput style={styles.input} placeholder="Contact Person" placeholderTextColor="#9ca3af" value={formData.contactPerson} onChangeText={(text) => setFormData({ ...formData, contactPerson: text })} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9ca3af" value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#9ca3af" value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} keyboardType="phone-pad" />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Create Client</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.list}>
          {clients.map((client) => (
            <TouchableOpacity key={client.id} style={styles.card} onPress={() => router.push(`/clients/${client.id}`)}>
              <Text style={styles.cardTitle}>{client.name}</Text>
              {client.contactPerson && <Text style={styles.cardSubtext}>Contact: {client.contactPerson}</Text>}
              {client.email && <Text style={styles.cardSubtext}>Email: {client.email}</Text>}
              <Text style={styles.cardFooter}>Firms: {client._count.firms}</Text>
            </TouchableOpacity>
          ))}
          {clients.length === 0 && <Text style={styles.emptyText}>No clients found</Text>}
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
  addButton: { color: '#0ea5e9', fontSize: 16, fontWeight: '600' },
  form: { backgroundColor: 'white', margin: 16, padding: 16, borderRadius: 12 },
  formTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#0f172a' },
  input: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16, color: '#0f172a' },
  submitButton: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  list: { padding: 16 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  cardSubtext: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  cardFooter: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 32 },
});
