import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Service {
  id: number;
  name: string;
  description: string | null;
  category: string;
  frequency: string;
  rate: number;
  isActive: boolean;
}

const categories = [
  { value: 'ITR', label: 'Income Tax (ITR)' },
  { value: 'GST', label: 'GST' },
  { value: 'TDS', label: 'TDS' },
  { value: 'AUDIT', label: 'Audit' },
  { value: 'ROC', label: 'ROC' },
  { value: 'REGISTRATION', label: 'Registration' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'OTHER', label: 'Other' },
];

const frequencies = [
  { value: 'ONE_TIME', label: 'One-time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const getCategoryLabel = (category: string) => {
  return categories.find(c => c.value === category)?.label || category;
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    ITR: '#3b82f6',
    GST: '#22c55e',
    TDS: '#a855f7',
    AUDIT: '#f59e0b',
    ROC: '#ef4444',
    REGISTRATION: '#06b6d4',
    CONSULTATION: '#ec4899',
    OTHER: '#64748b',
  };
  return colors[category] || '#64748b';
};

const getFrequencyLabel = (frequency: string) => {
  return frequencies.find(f => f.value === frequency)?.label || frequency;
};

export default function ServicesScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'ITR',
    frequency: 'ONE_TIME',
    rate: '',
  });

  const isCA = user?.role === 'CA';

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    if (!isCA) {
      showAlert('Access Denied', 'Only CA can access service settings');
      router.canGoBack() ? router.back() : router.replace('/dashboard');
      return;
    }
    loadServices();
  }, [isAuthenticated, isCA]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (services.length > 0) {
      showAlert('Info', 'Default services can only be added when you have no existing services.');
      return;
    }
    
    setSeeding(true);
    try {
      const response = await api.post('/services/seed-defaults');
      showAlert('Success', response.data.message);
      loadServices();
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to seed default services');
    } finally {
      setSeeding(false);
    }
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category: 'ITR',
      frequency: 'ONE_TIME',
      rate: '',
    });
    setShowModal(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category,
      frequency: service.frequency,
      rate: service.rate.toString(),
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showAlert('Error', 'Service name is required');
      return;
    }
    
    if (!formData.rate || parseFloat(formData.rate) < 0) {
      showAlert('Error', 'Valid rate is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        frequency: formData.frequency,
        rate: parseFloat(formData.rate),
      };

      if (editingService) {
        await api.put(`/services/${editingService.id}`, payload);
        showAlert('Success', 'Service updated successfully');
      } else {
        await api.post('/services', payload);
        showAlert('Success', 'Service created successfully');
      }
      
      setShowModal(false);
      loadServices();
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: Service) => {
    const confirmDelete = () => {
      api.delete(`/services/${service.id}`)
        .then(() => {
          showAlert('Success', 'Service deleted successfully');
          loadServices();
        })
        .catch((error: any) => {
          showAlert('Error', error.response?.data?.error || 'Failed to delete service');
        });
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${service.name}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Service',
        `Are you sure you want to delete "${service.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services & Pricing</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadServices();
          }} />
        }
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📦 Your Services</Text>
          <Text style={styles.infoText}>
            Configure your service offerings and pricing. These will be used when adding clients.
          </Text>
        </View>

        {services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Services Yet</Text>
            <Text style={styles.emptyText}>Add your service offerings to speed up client onboarding.</Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity 
                style={[styles.emptyButton, styles.secondaryButton]}
                onPress={handleSeedDefaults}
                disabled={seeding}
              >
                {seeding ? (
                  <ActivityIndicator size="small" color="#64748b" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Load Defaults</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
                <Text style={styles.primaryButtonText}>Create Custom</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          Object.entries(groupedServices).map(([category, categoryServices]) => (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category) + '20' }]}>
                  <Text style={[styles.categoryBadgeText, { color: getCategoryColor(category) }]}>
                    {getCategoryLabel(category)}
                  </Text>
                </View>
                <Text style={styles.categoryCount}>{categoryServices.length} services</Text>
              </View>
              
              {categoryServices.map((service) => (
                <View key={service.id} style={styles.serviceCard}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <View style={styles.serviceDetails}>
                      <Text style={styles.serviceFrequency}>{getFrequencyLabel(service.frequency)}</Text>
                      {service.description && (
                        <Text style={styles.serviceDescription} numberOfLines={1}>
                          {service.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.serviceRight}>
                    <Text style={styles.serviceRate}>₹{service.rate.toLocaleString('en-IN')}</Text>
                    <View style={styles.serviceActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => openEditModal(service)}
                      >
                        <Text style={styles.editButtonText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDelete(service)}
                      >
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

        {/* Info Section */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 How Services Work</Text>
          <Text style={styles.tipText}>• When adding a client/firm, select a service to auto-create task and invoice</Text>
          <Text style={styles.tipText}>• Frequency indicates how often this service recurs</Text>
          <Text style={styles.tipText}>• You can override the rate for specific clients</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Service Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., ITR - Salaried Individual"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Brief description"
                multiline
                numberOfLines={2}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.pickerContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.pickerOption,
                      formData.category === cat.value && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat.value })}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.category === cat.value && styles.pickerOptionTextSelected,
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Frequency</Text>
              <View style={styles.frequencyContainer}>
                {frequencies.map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.frequencyOption,
                      formData.frequency === freq.value && styles.frequencyOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, frequency: freq.value })}
                  >
                    <Text style={[
                      styles.frequencyOptionText,
                      formData.frequency === freq.value && styles.frequencyOptionTextSelected,
                    ]}>
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Rate (₹) *</Text>
              <TextInput
                style={styles.input}
                value={formData.rate}
                onChangeText={(text) => setFormData({ ...formData, rate: text })}
                placeholder="1500"
                keyboardType="numeric"
              />
              <Text style={styles.inputHint}>Enter amount in rupees</Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingService ? 'Update' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 16 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, color: '#7c3aed', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  addButton: { backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  
  content: { flex: 1 },
  
  infoCard: { backgroundColor: '#fff', margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  infoText: { fontSize: 14, color: '#64748b' },
  
  emptyContainer: { backgroundColor: '#fff', margin: 16, padding: 32, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  emptyActions: { flexDirection: 'row', gap: 12 },
  emptyButton: { backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  secondaryButton: { backgroundColor: '#f1f5f9' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  secondaryButtonText: { color: '#64748b', fontWeight: '600' },
  
  categorySection: { marginHorizontal: 16, marginBottom: 16 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  categoryBadgeText: { fontSize: 12, fontWeight: '600' },
  categoryCount: { marginLeft: 8, fontSize: 12, color: '#64748b' },
  
  serviceCard: { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  serviceDetails: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceFrequency: { fontSize: 12, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  serviceDescription: { fontSize: 12, color: '#94a3b8', flex: 1 },
  serviceRight: { alignItems: 'flex-end' },
  serviceRate: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  serviceActions: { flexDirection: 'row', gap: 8 },
  actionButton: { padding: 4 },
  editButtonText: { fontSize: 18 },
  deleteButtonText: { fontSize: 18 },
  
  tipCard: { backgroundColor: '#eff6ff', margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#1e40af', marginBottom: 8 },
  tipText: { fontSize: 13, color: '#3b82f6', marginBottom: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  modalClose: { fontSize: 24, color: '#64748b' },
  modalBody: { padding: 20 },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, color: '#1f2937' },
  textArea: { height: 80, textAlignVertical: 'top' },
  inputHint: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  pickerOptionSelected: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  pickerOptionText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  pickerOptionTextSelected: { color: '#fff' },
  
  frequencyContainer: { flexDirection: 'row', gap: 8 },
  frequencyOption: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  frequencyOptionSelected: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  frequencyOptionText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  frequencyOptionTextSelected: { color: '#fff' },
  
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f1f5f9' },
  saveButton: { backgroundColor: '#7c3aed' },
  cancelButtonText: { color: '#64748b', fontWeight: '600', fontSize: 16 },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

