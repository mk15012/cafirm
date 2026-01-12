import { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import UpgradeModal from '@/components/UpgradeModal';

interface Credential {
  id: number;
  clientId: number;
  client: { id: number; name: string };
  firmId: number | null;
  firm: { id: number; name: string } | null;
  portalName: string;
  portalUrl: string | null;
  username: string;
  password: string;
  remarks: string | null;
}

interface Client {
  id: number;
  name: string;
  firms: { id: number; name: string }[];
}

const COMMON_PORTALS = [
  'Income Tax Portal',
  'GST Portal',
  'MCA Portal',
  'TDS Portal (TRACES)',
  'PF Portal (EPFO)',
  'ESI Portal',
  'E-Way Bill',
  'Other',
];

export default function CredentialsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPortalFilter, setSelectedPortalFilter] = useState('All');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    currentUsage: number;
    limit: number;
    plan: string;
    canAdd: boolean;
  } | null>(null);
  
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const isCA = user?.role === 'CA';
  const isIndividual = user?.role === 'INDIVIDUAL';
  const [formData, setFormData] = useState({
    clientId: '',
    firmId: '',
    portalName: '',
    username: '',
    password: '',
    remarks: '',
  });

  // Filter firms based on selected client
  const filteredFirms = useMemo(() => {
    if (!selectedClientId) return [];
    const client = clients.find(c => c.id === selectedClientId);
    return client?.firms || [];
  }, [clients, selectedClientId]);

  // Get unique portal types for tabs
  const portalTypes = useMemo(() => {
    const types = new Set(credentials.map(cred => cred.portalName));
    return ['All', ...Array.from(types).sort()];
  }, [credentials]);

  // Get portal counts for badges
  const portalCounts = useMemo(() => {
    const counts: Record<string, number> = { All: credentials.length };
    credentials.forEach(cred => {
      counts[cred.portalName] = (counts[cred.portalName] || 0) + 1;
    });
    return counts;
  }, [credentials]);

  // Filter credentials based on search and portal filter
  const filteredCredentials = useMemo(() => {
    return credentials.filter(cred => {
      const matchesSearch = !searchQuery || 
        cred.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.firm?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.portalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.username.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPortal = selectedPortalFilter === 'All' || 
        cred.portalName === selectedPortalFilter;
      
      return matchesSearch && matchesPortal;
    });
  }, [credentials, searchQuery, selectedPortalFilter]);

  // Group credentials by client
  const groupedCredentials = useMemo(() => {
    const grouped: Record<string, Credential[]> = {};
    filteredCredentials.forEach(cred => {
      const key = cred.client.name;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(cred);
    });
    return grouped;
  }, [filteredCredentials]);

  const canAccess = user?.role === 'CA' || user?.role === 'INDIVIDUAL';

  useEffect(() => {
    if (isAuthenticated && canAccess) {
      loadData();
      if (isCA || isIndividual) {
        checkCredentialLimit();
      }
    } else if (isAuthenticated && !canAccess) {
      router.replace('/dashboard');
      Alert.alert('Access Denied', 'You do not have access to credentials');
    }
  }, [isAuthenticated, user]);

  const checkCredentialLimit = async () => {
    try {
      const response = await api.get('/subscription/check/credentials');
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

  const handleAddCredentialClick = () => {
    if (subscriptionInfo && !subscriptionInfo.canAdd) {
      setShowUpgradeModal(true);
      return;
    }
    setShowAddModal(true);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [credsRes, clientsRes] = await Promise.all([
        api.get('/credentials'),
        api.get('/clients'),
      ]);
      setCredentials(credsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleClientChange = (clientId: number | null) => {
    setSelectedClientId(clientId);
    setFormData({ ...formData, clientId: clientId?.toString() || '', firmId: '' });
  };

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.portalName || !formData.username || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await api.post('/credentials', {
        ...formData,
        clientId: parseInt(formData.clientId),
        firmId: formData.firmId ? parseInt(formData.firmId) : null,
      });
      Alert.alert('Success', 'Credential added successfully!');
      resetForm();
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save credential');
    }
  };

  const handleDelete = (id: number, portalName: string) => {
    Alert.alert(
      'Delete Credential',
      `Delete credentials for "${portalName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/credentials/${id}`);
              Alert.alert('Success', 'Credential deleted!');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setShowAddModal(false);
    setSelectedClientId(null);
    setFormData({
      clientId: '',
      firmId: '',
      portalName: '',
      username: '',
      password: '',
      remarks: '',
    });
  };

  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const handleOpenAddModal = () => {
    // Check subscription limit first
    if (subscriptionInfo && !subscriptionInfo.canAdd) {
      setShowUpgradeModal(true);
      return;
    }

    // For INDIVIDUAL users, auto-select their personal client and firm
    if (isIndividual && clients.length > 0) {
      const personalClient = clients.find(c => c.name.includes('Personal Finances'));
      if (personalClient) {
        setSelectedClientId(personalClient.id);
        setFormData(prev => ({ 
          ...prev, 
          clientId: String(personalClient.id),
          firmId: personalClient.firms?.[0]?.id ? String(personalClient.firms[0].id) : '',
        }));
      }
    }
    setShowAddModal(true);
  };

  if (!isAuthenticated || !canAccess) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>🔐 {isIndividual ? 'My Credentials' : 'Portal Credentials'}</Text>
          <Text style={styles.headerSubtitle}>{isIndividual ? 'Store your portal logins securely' : 'Securely store client govt portal logins'}</Text>
        </View>

        {/* Search */}
        {/* Portal Type Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {portalTypes.map((portal) => (
            <TouchableOpacity
              key={portal}
              onPress={() => setSelectedPortalFilter(portal)}
              style={[
                styles.portalTab,
                selectedPortalFilter === portal && styles.portalTabActive
              ]}
            >
              <Text style={styles.portalTabIcon}>
                {portal === 'All' ? '📋' : 
                 portal.includes('Income Tax') ? '💰' :
                 portal.includes('GST') ? '📊' :
                 portal.includes('MCA') ? '🏢' :
                 portal.includes('TDS') || portal.includes('TRACES') ? '📑' :
                 portal.includes('PF') || portal.includes('EPFO') ? '👷' :
                 portal.includes('ESI') ? '🏥' :
                 portal.includes('E-Way') ? '🚚' : '🔐'}
              </Text>
              <Text style={[
                styles.portalTabText,
                selectedPortalFilter === portal && styles.portalTabTextActive
              ]}>
                {portal === 'All' ? 'All' : portal.replace(' Portal', '').replace(' (EPFO)', '').replace(' (TRACES)', '')}
              </Text>
              <View style={[
                styles.portalTabBadge,
                selectedPortalFilter === portal && styles.portalTabBadgeActive
              ]}>
                <Text style={[
                  styles.portalTabBadgeText,
                  selectedPortalFilter === portal && styles.portalTabBadgeTextActive
                ]}>
                  {portalCounts[portal] || 0}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by client, firm, or username..."
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Credentials List */}
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />}
        >
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : Object.keys(groupedCredentials).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔐</Text>
              <Text style={styles.emptyTitle}>No Credentials Found</Text>
              <Text style={styles.emptyText}>Add portal credentials for your clients</Text>
            </View>
          ) : (
            Object.entries(groupedCredentials).map(([clientName, clientCreds]) => (
              <View key={clientName} style={styles.clientGroup}>
                <View style={styles.clientHeader}>
                  <Text style={styles.clientName}>{clientName}</Text>
                  <Text style={styles.clientCount}>{clientCreds.length} portals</Text>
                </View>
                {clientCreds.map((cred) => (
                  <View key={cred.id} style={styles.credentialCard}>
                    <View style={styles.credentialHeader}>
                      <Text style={styles.portalName}>{cred.portalName}</Text>
                      {cred.firm && (
                        <View style={styles.firmBadge}>
                          <Text style={styles.firmBadgeText}>{cred.firm.name}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.credentialRow}>
                      <Text style={styles.credentialLabel}>User:</Text>
                      <Text style={styles.credentialValue}>{cred.username}</Text>
                      <TouchableOpacity onPress={() => copyToClipboard(cred.username, 'Username')}>
                        <Text style={styles.copyButton}>📋</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.credentialRow}>
                      <Text style={styles.credentialLabel}>Pass:</Text>
                      <Text style={styles.credentialValue}>
                        {visiblePasswords.has(cred.id) ? cred.password : '••••••••'}
                      </Text>
                      <TouchableOpacity onPress={() => togglePasswordVisibility(cred.id)}>
                        <Text style={styles.eyeButton}>{visiblePasswords.has(cred.id) ? '🙈' : '👁️'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => copyToClipboard(cred.password, 'Password')}>
                        <Text style={styles.copyButton}>📋</Text>
                      </TouchableOpacity>
                    </View>

                    {cred.remarks && (
                      <Text style={styles.remarks}>{cred.remarks}</Text>
                    )}

                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDelete(cred.id, cred.portalName)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Add Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Credential</Text>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hide client/firm selection for INDIVIDUAL users */}
                {!isIndividual && (
                  <>
                    <Text style={styles.inputLabel}>Client *</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={selectedClientId}
                        onValueChange={handleClientChange}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Client" value={null} />
                        {clients.map(client => (
                          <Picker.Item key={client.id} label={client.name} value={client.id} />
                        ))}
                      </Picker>
                    </View>

                    <Text style={styles.inputLabel}>Firm (Optional)</Text>
                    <View style={[styles.pickerContainer, !selectedClientId && styles.pickerDisabled]}>
                      <Picker
                        selectedValue={formData.firmId}
                        onValueChange={(v) => setFormData({ ...formData, firmId: v || '' })}
                        enabled={!!selectedClientId}
                        style={styles.picker}
                      >
                        <Picker.Item label="All Firms / Client Level" value="" />
                        {filteredFirms.map(firm => (
                          <Picker.Item key={firm.id} label={firm.name} value={firm.id.toString()} />
                        ))}
                      </Picker>
                    </View>
                  </>
                )}

                <Text style={styles.inputLabel}>Portal *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.portalName}
                    onValueChange={(v) => setFormData({ ...formData, portalName: v })}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Portal" value="" />
                    {COMMON_PORTALS.map(portal => (
                      <Picker.Item key={portal} label={portal} value={portal} />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.inputLabel}>Username / ID *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.username}
                  onChangeText={(v) => setFormData({ ...formData, username: v })}
                  placeholder="Enter username or PAN"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={styles.inputLabel}>Password *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.password}
                  onChangeText={(v) => setFormData({ ...formData, password: v })}
                  placeholder="Enter password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                />

                <Text style={styles.inputLabel}>Remarks</Text>
                <TextInput
                  style={[styles.textInput, { height: 80 }]}
                  value={formData.remarks}
                  onChangeText={(v) => setFormData({ ...formData, remarks: v })}
                  placeholder="Any additional notes..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                />
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Upgrade Modal */}
        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          resource="credentials"
          currentUsage={subscriptionInfo?.currentUsage || 0}
          limit={subscriptionInfo?.limit === -1 ? 999 : subscriptionInfo?.limit || 0}
          currentPlan={subscriptionInfo?.plan || 'FREE'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  header: {
    backgroundColor: '#7c3aed',
    padding: 20,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: { padding: 8, marginLeft: -8 },
  backButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: 'white' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tabsContainer: {
    maxHeight: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabsContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  portalTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  portalTabActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  portalTabIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  portalTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  portalTabTextActive: {
    color: 'white',
  },
  portalTabBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 4,
  },
  portalTabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  portalTabBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
  },
  portalTabBadgeTextActive: {
    color: 'white',
  },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  searchInput: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  list: { flex: 1 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#64748b' },
  clientGroup: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  clientName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  clientCount: { fontSize: 12, color: '#64748b' },
  credentialCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  credentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  portalName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  firmBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  firmBadgeText: { fontSize: 11, color: '#2563eb', fontWeight: '500' },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  credentialLabel: { fontSize: 13, color: '#475569', fontWeight: '600', width: 45 },
  credentialValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  eyeButton: { fontSize: 16, marginLeft: 4 },
  copyButton: { fontSize: 14, marginLeft: 4 },
  remarks: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    padding: 8,
  },
  deleteButtonText: { fontSize: 13, color: '#ef4444' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  pickerDisabled: { opacity: 0.5 },
  picker: { height: 50 },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f8fafc',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  submitButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: { fontSize: 15, fontWeight: '600', color: 'white' },
});

