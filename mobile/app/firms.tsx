import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator, Modal, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Firm {
  id: number;
  name: string;
  panNumber: string;
  gstNumber?: string;
  registrationNumber?: string;
  address?: string;
  status: string;
  client: { id: number; name: string };
  _count: { tasks: number; documents: number; invoices: number };
}

interface Client {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
  category: string;
  rate: number;
  frequency: string;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
}

export default function FirmsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFirm, setEditingFirm] = useState<Firm | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const isCA = user?.role === 'CA';

  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    panNumber: '',
    gstNumber: '',
    registrationNumber: '',
    address: '',
    // Service & auto-creation fields
    serviceId: '',
    assignedToId: '',
    createTask: true,
    createInvoice: true,
  });

  // Filter firms based on search
  const filteredFirms = firms.filter(firm =>
    firm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    firm.panNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    firm.gstNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    firm.client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadFirms();
      loadClients();
      loadServices();
      loadTeamMembers();
    }
  }, [isAuthenticated]);

  const loadFirms = async () => {
    try {
      const response = await api.get('/firms');
      setFirms(response.data);
    } catch (error) {
      console.error('Failed to load firms:', error);
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
      console.error('Failed to load clients:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      const servicesWithRupees = response.data.map((s: Service) => ({
        ...s,
        rate: s.rate / 100,
      }));
      setServices(servicesWithRupees);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const response = await api.get('/users');
      setTeamMembers(response.data);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showAlert('Error', 'Firm name is required');
      return;
    }
    if (!formData.clientId) {
      showAlert('Error', 'Please select a client');
      return;
    }
    if (!formData.panNumber.trim()) {
      showAlert('Error', 'PAN number is required');
      return;
    }
    try {
      if (editingFirm) {
        await api.put(`/firms/${editingFirm.id}`, {
          clientId: formData.clientId,
          name: formData.name,
          panNumber: formData.panNumber,
          gstNumber: formData.gstNumber,
          registrationNumber: formData.registrationNumber,
          address: formData.address,
        });
        showAlert('Success', 'Firm updated successfully');
      } else {
        const response = await api.post('/firms', {
          ...formData,
          serviceId: formData.serviceId || undefined,
          assignedToId: formData.assignedToId || undefined,
        });
        
        // Show detailed success message
        const { task, invoice } = response.data;
        if (task && invoice) {
          showAlert('Success', 'Firm created with task and invoice!');
        } else if (task) {
          showAlert('Success', 'Firm created with task!');
        } else if (invoice) {
          showAlert('Success', 'Firm created with invoice!');
        } else {
          showAlert('Success', 'Firm created successfully!');
        }
      }
      closeForm();
      loadFirms();
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to save firm');
    }
  };

  const handleEdit = (firm: Firm) => {
    setEditingFirm(firm);
    setFormData({
      clientId: firm.client.id.toString(),
      name: firm.name,
      panNumber: firm.panNumber,
      gstNumber: firm.gstNumber || '',
      registrationNumber: firm.registrationNumber || '',
      address: firm.address || '',
      serviceId: '',
      assignedToId: '',
      createTask: true,
      createInvoice: true,
    });
    setSelectedClientId(firm.client.id.toString());
    setShowForm(true);
  };

  const handleDelete = (firm: Firm) => {
    const confirmDelete = async () => {
      try {
        await api.delete(`/firms/${firm.id}`);
        showAlert('Success', 'Firm deleted successfully');
        loadFirms();
      } catch (error: any) {
        showAlert('Error', error.response?.data?.error || 'Failed to delete firm');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${firm.name}"? This will also delete all associated tasks, documents, and invoices.`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Firm',
        `Are you sure you want to delete "${firm.name}"? This will also delete all associated tasks, documents, and invoices.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingFirm(null);
    setFormData({
      clientId: '',
      name: '',
      panNumber: '',
      gstNumber: '',
      registrationNumber: '',
      address: '',
      serviceId: '',
      assignedToId: '',
      createTask: true,
      createInvoice: true,
    });
    setSelectedClientId('');
  };

  const getSelectedServiceName = () => {
    const service = services.find(s => s.id.toString() === formData.serviceId);
    return service ? `${service.name} - ₹${service.rate.toLocaleString('en-IN')}` : 'Select Service (Optional)';
  };

  const getSelectedAssigneeName = () => {
    if (!formData.assignedToId) return 'Self (Default)';
    const member = teamMembers.find(m => m.id.toString() === formData.assignedToId);
    return member ? `${member.name} (${member.role})` : 'Self (Default)';
  };

  const getSelectedClientName = () => {
    const client = clients.find(c => c.id.toString() === formData.clientId);
    return client?.name || 'Select Client';
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')} style={styles.headerButton}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Firms</Text>
          <Text style={styles.subtitle}>{firms.length} total</Text>
        </View>
        {isCA ? (
          <TouchableOpacity onPress={() => setShowForm(true)} style={styles.headerButton}>
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
          placeholder="Search firms..."
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
            Found {filteredFirms.length} {filteredFirms.length === 1 ? 'firm' : 'firms'}
          </Text>
        </View>
      )}

      {/* Firms List */}
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFirms} colors={['#0ea5e9']} />}
      >
        <View style={styles.list}>
          {filteredFirms.map((firm) => (
            <TouchableOpacity key={firm.id} style={styles.card} onPress={() => router.push(`/firms/${firm.id}`)}>
              <View style={styles.cardHeader}>
                <View style={styles.firmIcon}>
                  <Text style={styles.firmIconText}>🏢</Text>
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={styles.cardTitle}>{firm.name}</Text>
                  <TouchableOpacity onPress={() => router.push(`/clients/${firm.client.id}`)}>
                    <Text style={styles.clientLink}>👤 {firm.client.name}</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: firm.status === 'Active' ? '#dcfce7' : '#f3f4f6' }]}>
                  <Text style={[styles.statusText, { color: firm.status === 'Active' ? '#16a34a' : '#6b7280' }]}>
                    {firm.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>PAN</Text>
                    <Text style={styles.infoValue}>{firm.panNumber}</Text>
                  </View>
                  {firm.gstNumber && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>GST</Text>
                      <Text style={styles.infoValue}>{firm.gstNumber}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>📋</Text>
                  <Text style={styles.statValue}>{firm._count.tasks}</Text>
                  <Text style={styles.statLabel}>Tasks</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>📄</Text>
                  <Text style={styles.statValue}>{firm._count.documents}</Text>
                  <Text style={styles.statLabel}>Docs</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>💰</Text>
                  <Text style={styles.statValue}>{firm._count.invoices}</Text>
                  <Text style={styles.statLabel}>Invoices</Text>
                </View>
              </View>

              {isCA && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(firm);
                    }}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(firm);
                    }}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))}
          {filteredFirms.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching firms' : 'No firms found'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery ? `No firms matching "${searchQuery}"` : 'Add your first firm to get started'}
              </Text>
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchLink}>Clear search</Text>
                </TouchableOpacity>
              ) : isCA && (
                <TouchableOpacity style={styles.emptyButton} onPress={() => setShowForm(true)}>
                  <Text style={styles.emptyButtonText}>+ Add Firm</Text>
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
                {editingFirm ? 'Edit Firm' : 'Add New Firm'}
              </Text>
              <TouchableOpacity onPress={closeForm}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Client *</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowClientPicker(true)}
              >
                <Text style={formData.clientId ? styles.selectValue : styles.selectPlaceholder}>
                  {getSelectedClientName()}
                </Text>
                <Text style={styles.selectArrow}>▼</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Firm Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Firm name"
                placeholderTextColor="#9ca3af"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.inputLabel}>PAN Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="ABCDE1234F"
                placeholderTextColor="#9ca3af"
                value={formData.panNumber}
                onChangeText={(text) => setFormData({ ...formData, panNumber: text.toUpperCase() })}
                maxLength={10}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>GST Number</Text>
              <TextInput
                style={styles.input}
                placeholder="29ABCDE1234F1Z5"
                placeholderTextColor="#9ca3af"
                value={formData.gstNumber}
                onChangeText={(text) => setFormData({ ...formData, gstNumber: text.toUpperCase() })}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Registration Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Registration number"
                placeholderTextColor="#9ca3af"
                value={formData.registrationNumber}
                onChangeText={(text) => setFormData({ ...formData, registrationNumber: text })}
              />

              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Firm address"
                placeholderTextColor="#9ca3af"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                multiline
                numberOfLines={3}
              />

              {/* Service Selection - Only for new firms */}
              {!editingFirm && services.length > 0 && (
                <View style={styles.serviceSection}>
                  <View style={styles.serviceSectionHeader}>
                    <Text style={styles.serviceSectionIcon}>⚡</Text>
                    <Text style={styles.serviceSectionTitle}>Quick Setup (Optional)</Text>
                  </View>
                  <Text style={styles.serviceSectionDesc}>
                    Select a service to auto-create task and invoice.
                  </Text>

                  <Text style={styles.inputLabel}>Service</Text>
                  <TouchableOpacity
                    style={styles.selectInput}
                    onPress={() => setShowServicePicker(true)}
                  >
                    <Text style={formData.serviceId ? styles.selectValue : styles.selectPlaceholder}>
                      {getSelectedServiceName()}
                    </Text>
                    <Text style={styles.selectArrow}>▼</Text>
                  </TouchableOpacity>

                  <Text style={styles.inputLabel}>Assign To</Text>
                  <TouchableOpacity
                    style={styles.selectInput}
                    onPress={() => setShowAssigneePicker(true)}
                  >
                    <Text style={formData.assignedToId ? styles.selectValue : styles.selectPlaceholder}>
                      {getSelectedAssigneeName()}
                    </Text>
                    <Text style={styles.selectArrow}>▼</Text>
                  </TouchableOpacity>

                  {formData.serviceId && (
                    <View style={styles.autoCreateSection}>
                      <Text style={styles.autoCreateTitle}>Auto-create:</Text>
                      <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Create Task</Text>
                        <Switch
                          value={formData.createTask}
                          onValueChange={(value) => setFormData({ ...formData, createTask: value })}
                          trackColor={{ false: '#d1d5db', true: '#a78bfa' }}
                          thumbColor={formData.createTask ? '#7c3aed' : '#f4f4f5'}
                        />
                      </View>
                      <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Create Invoice</Text>
                        <Switch
                          value={formData.createInvoice}
                          onValueChange={(value) => setFormData({ ...formData, createInvoice: value })}
                          trackColor={{ false: '#d1d5db', true: '#a78bfa' }}
                          thumbColor={formData.createInvoice ? '#7c3aed' : '#f4f4f5'}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}

              {!editingFirm && services.length === 0 && (
                <View style={styles.tipSection}>
                  <Text style={styles.tipText}>
                    💡 Configure services in Settings → Services & Pricing to enable quick task/invoice creation.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>
                  {editingFirm ? 'Update Firm' : 'Create Firm'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={closeForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Client Picker Modal */}
      <Modal visible={showClientPicker} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowClientPicker(false)}
        >
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Client</Text>
              <TouchableOpacity onPress={() => setShowClientPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={[
                    styles.pickerItem,
                    formData.clientId === client.id.toString() && styles.pickerItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, clientId: client.id.toString() });
                    setShowClientPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    formData.clientId === client.id.toString() && styles.pickerItemTextSelected
                  ]}>
                    {client.name}
                  </Text>
                  {formData.clientId === client.id.toString() && (
                    <Text style={styles.pickerCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              {clients.length === 0 && (
                <Text style={styles.pickerEmpty}>No clients available. Create a client first.</Text>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Service Picker Modal */}
      <Modal visible={showServicePicker} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowServicePicker(false)}
        >
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Service</Text>
              <TouchableOpacity onPress={() => setShowServicePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              <TouchableOpacity
                style={[styles.pickerItem, !formData.serviceId && styles.pickerItemSelected]}
                onPress={() => {
                  setFormData({ ...formData, serviceId: '' });
                  setShowServicePicker(false);
                }}
              >
                <Text style={[styles.pickerItemText, !formData.serviceId && styles.pickerItemTextSelected]}>
                  None (Skip)
                </Text>
                {!formData.serviceId && <Text style={styles.pickerCheck}>✓</Text>}
              </TouchableOpacity>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.pickerItem,
                    formData.serviceId === service.id.toString() && styles.pickerItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, serviceId: service.id.toString() });
                    setShowServicePicker(false);
                  }}
                >
                  <View style={styles.servicePickerItem}>
                    <Text style={[
                      styles.pickerItemText,
                      formData.serviceId === service.id.toString() && styles.pickerItemTextSelected
                    ]}>
                      {service.name}
                    </Text>
                    <Text style={styles.servicePickerRate}>₹{service.rate.toLocaleString('en-IN')}</Text>
                  </View>
                  {formData.serviceId === service.id.toString() && (
                    <Text style={styles.pickerCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Assignee Picker Modal */}
      <Modal visible={showAssigneePicker} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowAssigneePicker(false)}
        >
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Assign To</Text>
              <TouchableOpacity onPress={() => setShowAssigneePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              <TouchableOpacity
                style={[styles.pickerItem, !formData.assignedToId && styles.pickerItemSelected]}
                onPress={() => {
                  setFormData({ ...formData, assignedToId: '' });
                  setShowAssigneePicker(false);
                }}
              >
                <Text style={[styles.pickerItemText, !formData.assignedToId && styles.pickerItemTextSelected]}>
                  Self (Default)
                </Text>
                {!formData.assignedToId && <Text style={styles.pickerCheck}>✓</Text>}
              </TouchableOpacity>
              {teamMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.pickerItem,
                    formData.assignedToId === member.id.toString() && styles.pickerItemSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, assignedToId: member.id.toString() });
                    setShowAssigneePicker(false);
                  }}
                >
                  <View style={styles.servicePickerItem}>
                    <Text style={[
                      styles.pickerItemText,
                      formData.assignedToId === member.id.toString() && styles.pickerItemTextSelected
                    ]}>
                      {member.name}
                    </Text>
                    <Text style={styles.memberRole}>{member.role}</Text>
                  </View>
                  {formData.assignedToId === member.id.toString() && (
                    <Text style={styles.pickerCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
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
  firmIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center' },
  firmIconText: { fontSize: 24 },
  cardHeaderInfo: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  clientLink: { fontSize: 14, color: '#0ea5e9', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },

  cardBody: { padding: 16, paddingTop: 12, paddingBottom: 12 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  infoItem: {},
  infoLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#334155', fontFamily: 'monospace' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: '#fafafa', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  statItem: { alignItems: 'center' },
  statIcon: { fontSize: 16, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#94a3b8' },

  cardActions: { flexDirection: 'row' },
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
  selectInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectValue: { fontSize: 16, color: '#0f172a' },
  selectPlaceholder: { fontSize: 16, color: '#9ca3af' },
  selectArrow: { fontSize: 12, color: '#94a3b8' },

  submitButton: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelButton: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontSize: 16, fontWeight: '600' },

  // Picker
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  pickerContent: { backgroundColor: 'white', borderRadius: 16, maxHeight: '70%' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  pickerList: { maxHeight: 300 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerItemSelected: { backgroundColor: '#f0f9ff' },
  pickerItemText: { fontSize: 16, color: '#374151' },
  pickerItemTextSelected: { color: '#0ea5e9', fontWeight: '600' },
  pickerCheck: { color: '#0ea5e9', fontSize: 18 },
  pickerEmpty: { padding: 24, textAlign: 'center', color: '#94a3b8' },

  // Service section styles
  serviceSection: { marginTop: 16, padding: 16, backgroundColor: '#fefce8', borderRadius: 12, borderWidth: 1, borderColor: '#fde047' },
  serviceSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  serviceSectionIcon: { fontSize: 20, marginRight: 8 },
  serviceSectionTitle: { fontSize: 16, fontWeight: '700', color: '#854d0e' },
  serviceSectionDesc: { fontSize: 14, color: '#a16207', marginBottom: 16 },

  servicePickerItem: { flex: 1 },
  servicePickerRate: { fontSize: 14, color: '#64748b', marginTop: 2 },
  memberRole: { fontSize: 12, color: '#64748b', marginTop: 2 },

  autoCreateSection: { marginTop: 16, padding: 12, backgroundColor: '#fffbeb', borderRadius: 8 },
  autoCreateTitle: { fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchLabel: { fontSize: 14, color: '#374151' },

  tipSection: { marginTop: 16, padding: 12, backgroundColor: '#f1f5f9', borderRadius: 8 },
  tipText: { fontSize: 13, color: '#64748b', lineHeight: 18 },
});
