import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import api from '@/lib/api';

interface Client {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
  defaultFee: number;
}

interface User {
  id: number;
  name: string;
}

const ENTITY_TYPES = [
  'INDIVIDUAL',
  'HUF',
  'PARTNERSHIP',
  'LLP',
  'PRIVATE_LIMITED',
  'PUBLIC_LIMITED',
  'TRUST',
  'AOP',
  'BOI',
  'OTHER',
];

export default function AddFirmScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    panNumber: '',
    gstNumber: '',
    registrationNumber: '',
    entityType: 'INDIVIDUAL',
    address: '',
    serviceId: '',
    assignedToId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsRes, servicesRes, usersRes] = await Promise.all([
        api.get('/clients'),
        api.get('/services').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] })),
      ]);
      setClients(clientsRes.data || []);
      setServices(servicesRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Firm name is required');
      return;
    }
    if (!formData.clientId) {
      Alert.alert('Error', 'Please select a client');
      return;
    }
    if (!formData.panNumber.trim()) {
      Alert.alert('Error', 'PAN number is required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/firms', {
        clientId: parseInt(formData.clientId),
        name: formData.name,
        panNumber: formData.panNumber,
        gstNumber: formData.gstNumber || undefined,
        registrationNumber: formData.registrationNumber || undefined,
        address: formData.address || undefined,
        serviceId: formData.serviceId ? parseInt(formData.serviceId) : undefined,
        assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : undefined,
      });
      
      const { task, invoice } = response.data || {};
      let message = 'Firm added successfully!';
      if (task && invoice) {
        message = 'Firm created with task and invoice!';
      } else if (task) {
        message = 'Firm created with task!';
      } else if (invoice) {
        message = 'Firm created with invoice!';
      }
      
      Alert.alert('Success', message, [
        { text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/(tabs)/firms') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add firm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/firms')} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Firm</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Client Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Client *</Text>
          {loadingData ? (
            <ActivityIndicator size="small" color="#0ea5e9" />
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select Client" value="" />
                {clients.map((client) => (
                  <Picker.Item key={client.id} label={client.name} value={String(client.id)} />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Firm Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Firm Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Firm name"
            placeholderTextColor="#94a3b8"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        {/* PAN & GST Row */}
        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>PAN Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="ABCDE1234F"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              maxLength={10}
              value={formData.panNumber}
              onChangeText={(text) => setFormData({ ...formData, panNumber: text.toUpperCase() })}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>GST Number</Text>
            <TextInput
              style={styles.input}
              placeholder="29ABCDE1234F1Z5"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              maxLength={15}
              value={formData.gstNumber}
              onChangeText={(text) => setFormData({ ...formData, gstNumber: text.toUpperCase() })}
            />
          </View>
        </View>

        {/* Registration Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Registration Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Registration number"
            placeholderTextColor="#94a3b8"
            value={formData.registrationNumber}
            onChangeText={(text) => setFormData({ ...formData, registrationNumber: text })}
          />
        </View>

        {/* Address */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Firm address"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
        </View>

        {/* Quick Setup Section */}
        <View style={styles.quickSetupSection}>
          <View style={styles.quickSetupHeader}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#f59e0b" />
            <Text style={styles.quickSetupTitle}>Quick Setup (Optional)</Text>
          </View>
          <Text style={styles.quickSetupDescription}>
            Select a service to automatically create a task and invoice for this firm.
          </Text>

          {/* Service Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Service</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.serviceId}
                onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select Service (Optional)" value="" />
                {services.map((service) => (
                  <Picker.Item 
                    key={service.id} 
                    label={`${service.name} - ₹${service.defaultFee}`} 
                    value={String(service.id)} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Assign To Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Assign To</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.assignedToId}
                onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                style={styles.picker}
              >
                <Picker.Item label="Self (Default)" value="" />
                {users.map((user) => (
                  <Picker.Item key={user.id} label={user.name} value={String(user.id)} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Firm</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/firms')}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    backgroundColor: '#0f172a',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  formGroup: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  quickSetupSection: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  quickSetupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  quickSetupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
  },
  quickSetupDescription: {
    fontSize: 14,
    color: '#a16207',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});
