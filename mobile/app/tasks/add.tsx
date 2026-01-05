import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Firm {
  id: number;
  name: string;
  client?: { name: string };
}

interface User {
  id: number;
  name: string;
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function AddTaskScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    firmId: '',
    assignedToId: '',
    priority: 'MEDIUM',
    dueDate: new Date(),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [firmsRes, usersRes] = await Promise.all([
        api.get('/firms'),
        api.get('/users'),
      ]);
      setFirms(firmsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }
    if (!formData.firmId) {
      Alert.alert('Error', 'Please select a firm');
      return;
    }

    setLoading(true);
    try {
      await api.post('/tasks', {
        ...formData,
        firmId: parseInt(formData.firmId),
        assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : undefined,
        dueDate: formData.dueDate.toISOString(),
      });
      Alert.alert('Success', 'Task added successfully!', [
        { text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/(tabs)/tasks') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, dueDate: selectedDate });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/tasks')} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Task</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task title"
            placeholderTextColor="#94a3b8"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter task description"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Firm *</Text>
          {loadingData ? (
            <ActivityIndicator size="small" color="#0ea5e9" />
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.firmId}
                onValueChange={(value) => setFormData({ ...formData, firmId: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select a firm" value="" />
                {firms.map((firm) => (
                  <Picker.Item
                    key={firm.id}
                    label={`${firm.name}${firm.client ? ` (${firm.client.name})` : ''}`}
                    value={String(firm.id)}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Assign To</Text>
          {loadingData ? (
            <ActivityIndicator size="small" color="#0ea5e9" />
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.assignedToId}
                onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                style={styles.picker}
              >
                <Picker.Item label="Unassigned" value="" />
                {users.map((user) => (
                  <Picker.Item key={user.id} label={user.name} value={String(user.id)} />
                ))}
              </Picker>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
              style={styles.picker}
            >
              {PRIORITIES.map((priority) => (
                <Picker.Item key={priority} label={priority} value={priority} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialCommunityIcons name="calendar" size={20} color="#64748b" />
            <Text style={styles.dateButtonText}>
              {format(formData.dueDate, 'dd MMM yyyy')}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.dueDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Task</Text>
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
  dateButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1e293b',
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

