import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import UpgradeModal from '@/components/UpgradeModal';

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  _count?: {
    firms: number;
  };
}

export default function ClientsTabScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    currentUsage: number;
    limit: number;
    plan: string;
    canAdd: boolean;
  } | null>(null);

  const isIndividual = user?.role === 'INDIVIDUAL';
  const isCA = user?.role === 'CA';

  useEffect(() => {
    if (isAuthenticated && !isIndividual) {
      loadClients();
      if (isCA) {
        checkClientLimit();
      }
    }
  }, [isAuthenticated, isIndividual, isCA]);

  const checkClientLimit = async () => {
    try {
      const response = await api.get('/subscription/check/clients');
      setSubscriptionInfo({
        currentUsage: response.data.currentUsage,
        limit: response.data.limit === 'Unlimited' ? -1 : response.data.limit,
        plan: response.data.currentPlan,
        canAdd: response.data.canProceed,
      });
    } catch (error) {
      console.error('Failed to check subscription limit:', error);
      setSubscriptionInfo({ currentUsage: 0, limit: -1, plan: 'FREE', canAdd: true });
    }
  };

  const handleAddClientClick = () => {
    if (subscriptionInfo && !subscriptionInfo.canAdd) {
      setShowUpgradeModal(true);
      return;
    }
    router.push('/clients/add');
  };

  // Redirect individual users away
  useEffect(() => {
    if (isIndividual) {
      router.replace('/');
    }
  }, [isIndividual]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      setClients(response.data || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isIndividual) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading clients...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Clients</Text>
            <Text style={styles.headerSubtitle}>{filteredClients.length} clients</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddClientClick}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredClients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyTitle}>No Clients Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
            </Text>
          </View>
        ) : (
          filteredClients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={styles.clientCard}
              onPress={() => router.push(`/clients/${client.id}`)}
            >
              <View style={styles.clientAvatar}>
                <Text style={styles.clientInitial}>{client.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{client.name}</Text>
                {client.email && (
                  <Text style={styles.clientDetail}>✉️ {client.email}</Text>
                )}
                {client.phone && (
                  <Text style={styles.clientDetail}>📞 {client.phone}</Text>
                )}
              </View>
              <View style={styles.firmsBadge}>
                <Text style={styles.firmsBadgeText}>{client._count?.firms || 0}</Text>
                <Text style={styles.firmsLabel}>Firms</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        resource="clients"
        currentUsage={subscriptionInfo?.currentUsage || 0}
        limit={subscriptionInfo?.limit === -1 ? 999 : subscriptionInfo?.limit || 0}
        currentPlan={subscriptionInfo?.plan || 'FREE'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16 },
  header: {
    backgroundColor: '#0f172a',
    padding: 20,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  addButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  clientCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  clientDetail: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  firmsBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  firmsBadgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  firmsLabel: {
    fontSize: 10,
    color: '#64748b',
  },
});



