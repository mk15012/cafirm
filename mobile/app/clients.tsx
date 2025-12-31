import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator, Modal } from 'react-native';
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
  address?: string;
  notes?: string;
  _count: { firms: number };
}

export default function ClientsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isCA = user?.role === 'CA';
  const [formData, setFormData] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '', notes: '' });
  
  // Subscription limit checking
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    currentUsage: number;
    limit: number;
    plan: string;
    canAdd: boolean;
  } | null>(null);

  // Load subscription limits for CA users
  useEffect(() => {
    if (isAuthenticated && isCA) {
      checkClientLimit();
    }
  }, [isAuthenticated, isCA]);

  const checkClientLimit = async () => {
    try {
      const response = await api.get('/subscription/check/clients');
      setSubscriptionInfo({
        currentUsage: response.data.currentUsage,
        limit: response.data.limit === 'Unlimited' ? -1 : response.data.limit,
        plan: response.data.currentPlan === 'FREE' ? 'Starter' : response.data.currentPlan,
        canAdd: response.data.canProceed,
      });
    } catch (error) {
      console.error('Failed to check subscription limit:', error);
      setSubscriptionInfo({ currentUsage: 0, limit: -1, plan: 'Starter', canAdd: true });
    }
  };

  const handleAddClientClick = () => {
    if (isCA && subscriptionInfo && !subscriptionInfo.canAdd) {
      setShowUpgradeModal(true);
      return;
    }
    setShowForm(true);
  };

  // Filter clients based on search
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadClients();
    }
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
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, formData);
        Alert.alert('Success', 'Client updated successfully');
      } else {
        await api.post('/clients', formData);
        Alert.alert('Success', 'Client created successfully');
      }
      setShowForm(false);
      setEditingClient(null);
      setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', notes: '' });
      loadClients();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save client');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      contactPerson: client.contactPerson || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = (client: Client) => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete "${client.name}"? This will also delete all associated firms.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/clients/${client.id}`);
              Alert.alert('Success', 'Client deleted successfully');
              loadClients();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete client');
            }
          },
        },
      ]
    );
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingClient(null);
    setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', notes: '' });
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')} style={styles.headerButton}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Clients</Text>
          <Text style={styles.subtitle}>{clients.length} total</Text>
        </View>
        {isCA ? (
          <TouchableOpacity onPress={handleAddClientClick} style={styles.headerButton}>
            <Text style={styles.addButton}>+ Add</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results Info */}
      {searchQuery.length > 0 && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            Found {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
          </Text>
        </View>
      )}

      {/* Client List */}
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadClients} colors={['#0ea5e9']} />}
      >
        <View style={styles.list}>
          {filteredClients.map((client) => (
            <TouchableOpacity key={client.id} style={styles.card} onPress={() => router.push(`/clients/${client.id}`)}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{client.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={styles.cardTitle}>{client.name}</Text>
                  {client.contactPerson && <Text style={styles.cardSubtext}>{client.contactPerson}</Text>}
                </View>
                <View style={styles.firmsBadge}>
                  <Text style={styles.firmsBadgeText}>{client._count.firms}</Text>
                  <Text style={styles.firmsBadgeLabel}>firms</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                {client.email && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>✉️</Text>
                    <Text style={styles.infoText}>{client.email}</Text>
                  </View>
                )}
                {client.phone && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📞</Text>
                    <Text style={styles.infoText}>{client.phone}</Text>
                  </View>
                )}
              </View>

              {isCA && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(client);
                    }}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(client);
                    }}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))}
          {filteredClients.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching clients' : 'No clients found'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery ? `No clients matching "${searchQuery}"` : 'Add your first client to get started'}
              </Text>
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchLink}>Clear search</Text>
                </TouchableOpacity>
              ) : isCA && (
                <TouchableOpacity style={styles.emptyButton} onPress={handleAddClientClick}>
                  <Text style={styles.emptyButtonText}>+ Add Client</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </Text>
              <TouchableOpacity onPress={closeForm}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Client name"
                placeholderTextColor="#9ca3af"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.inputLabel}>Contact Person</Text>
              <TextInput
                style={styles.input}
                placeholder="Contact person name"
                placeholderTextColor="#9ca3af"
                value={formData.contactPerson}
                onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor="#9ca3af"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 1234567890"
                placeholderTextColor="#9ca3af"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Client address"
                placeholderTextColor="#9ca3af"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional notes"
                placeholderTextColor="#9ca3af"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>
                  {editingClient ? 'Update Client' : 'Create Client'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={closeForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upgrade Modal - Shows when client limit is reached */}
      <Modal visible={showUpgradeModal} animationType="fade" transparent>
        <View style={styles.upgradeOverlay}>
          <View style={styles.upgradeModal}>
            {/* Header */}
            <View style={styles.upgradeHeader}>
              <Text style={styles.upgradeEmoji}>👑</Text>
              <Text style={styles.upgradeTitle}>Upgrade Required</Text>
              <Text style={styles.upgradeSubtitle}>You've reached your plan limit</Text>
            </View>

            {/* Content */}
            <View style={styles.upgradeContent}>
              <View style={styles.limitBox}>
                <Text style={styles.limitIcon}>⚡</Text>
                <View>
                  <Text style={styles.limitTitle}>Clients Limit Reached</Text>
                  <Text style={styles.limitText}>
                    Using {subscriptionInfo?.currentUsage || 0} of {subscriptionInfo?.limit === -1 ? '∞' : subscriptionInfo?.limit || 3} clients
                  </Text>
                </View>
              </View>

              <Text style={styles.upgradeLabel}>Upgrade to Basic to get:</Text>
              <View style={styles.benefitsList}>
                <Text style={styles.benefitItem}>✓ 15 Clients</Text>
                <Text style={styles.benefitItem}>✓ 3 Team Members</Text>
                <Text style={styles.benefitItem}>✓ Approval Workflows</Text>
                <Text style={styles.benefitItem}>✓ Meeting Scheduler</Text>
              </View>

              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={() => {
                  setShowUpgradeModal(false);
                  Alert.alert('Upgrade', 'Please upgrade from the web app settings to unlock more features.');
                }}
              >
                <Text style={styles.upgradeButtonText}>View Plans & Upgrade →</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.laterButton}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={styles.laterButtonText}>Maybe Later</Text>
              </TouchableOpacity>

              <Text style={styles.currentPlanText}>Current plan: {subscriptionInfo?.plan || 'Starter'}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
  container: { flex: 1 },
  
  // Header
  header: { backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerButton: { width: 60 },
  headerCenter: { alignItems: 'center' },
  backButton: { color: '#0ea5e9', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#94a3b8' },
  addButton: { color: '#0ea5e9', fontSize: 16, fontWeight: '600', textAlign: 'right' },

  // Search
  searchContainer: { backgroundColor: 'white', margin: 16, marginBottom: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#0f172a' },
  clearButton: { padding: 8 },
  clearButtonText: { color: '#94a3b8', fontSize: 16 },
  resultsInfo: { paddingHorizontal: 16, marginBottom: 8 },
  resultsText: { fontSize: 14, color: '#64748b' },

  // List
  list: { padding: 16, paddingTop: 8 },
  card: { backgroundColor: 'white', borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 20, fontWeight: '700' },
  cardHeaderInfo: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  cardSubtext: { fontSize: 14, color: '#64748b', marginTop: 2 },
  firmsBadge: { alignItems: 'center', backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  firmsBadgeText: { fontSize: 18, fontWeight: '700', color: '#0ea5e9' },
  firmsBadgeLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase' },

  cardBody: { padding: 16, paddingTop: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon: { marginRight: 8, fontSize: 14 },
  infoText: { fontSize: 14, color: '#475569' },

  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionButton: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  editButton: { borderRightWidth: 1, borderRightColor: '#f1f5f9' },
  editButtonText: { color: '#0ea5e9', fontSize: 14, fontWeight: '600' },
  deleteButton: {},
  deleteButtonText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },

  // Empty State
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 16 },
  clearSearchLink: { color: '#0ea5e9', fontWeight: '600' },
  emptyButton: { backgroundColor: '#0ea5e9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  modalClose: { fontSize: 24, color: '#94a3b8', padding: 4 },
  modalBody: { padding: 20 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 12 },

  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, color: '#0f172a', marginBottom: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  submitButton: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelButton: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontSize: 16, fontWeight: '600' },

  // DEMO: Upgrade Modal Styles
  upgradeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  upgradeModal: { backgroundColor: 'white', borderRadius: 20, width: '100%', maxWidth: 340, overflow: 'hidden' },
  upgradeHeader: { backgroundColor: '#f59e0b', paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' },
  upgradeEmoji: { fontSize: 48, marginBottom: 12 },
  upgradeTitle: { fontSize: 22, fontWeight: '700', color: 'white', marginBottom: 4 },
  upgradeSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  upgradeContent: { padding: 24 },
  limitBox: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  limitIcon: { fontSize: 24 },
  limitTitle: { fontSize: 14, fontWeight: '600', color: '#dc2626' },
  limitText: { fontSize: 12, color: '#b91c1c' },
  upgradeLabel: { fontSize: 14, fontWeight: '500', color: '#64748b', marginBottom: 12 },
  benefitsList: { marginBottom: 20 },
  benefitItem: { fontSize: 14, color: '#0f172a', paddingVertical: 4 },
  upgradeButton: { backgroundColor: '#7c3aed', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  upgradeButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  laterButton: { padding: 12, alignItems: 'center' },
  laterButtonText: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  currentPlanText: { textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 8 },
});
