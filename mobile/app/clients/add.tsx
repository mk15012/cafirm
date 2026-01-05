import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/lib/api';

export default function AddClientScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Client name is required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/clients', formData);
      Alert.alert('Success', 'Client added successfully!', [
        { text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/(tabs)/clients') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/clients')} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Client</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Client Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter client name"
            placeholderTextColor="#94a3b8"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Person</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter contact person name"
            placeholderTextColor="#94a3b8"
            value={formData.contactPerson}
            onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter address"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional notes"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Client</Text>
          )}
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
  scrollContent: { padding: 16 },
  formGroup: { marginBottom: 16 },
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
});

