import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Firm {
  id: number;
  name: string;
  panNumber: string;
  gstNumber?: string;
  status: string;
  client: { id: number; name: string };
  _count: { tasks: number; documents: number; invoices: number };
}

export default function FirmsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadFirms();
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

  if (!isAuthenticated || loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading firms...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFirms} colors={['#0ea5e9']} />}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Firms</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.list}>
          {firms.map((firm) => (
            <TouchableOpacity key={firm.id} style={styles.card} onPress={() => router.push(`/firms/${firm.id}`)}>
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
  list: { padding: 16 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', flex: 1, color: '#0f172a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  cardSubtext: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  cardFooterText: { fontSize: 12, color: '#94a3b8' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 32 },
});
