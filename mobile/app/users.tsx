import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  reportsTo?: { id: number; name: string };
}

export default function UsersScreen() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'STAFF',
    reportsToId: '',
  });
  const [managers, setManagers] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/auth/login');
        return;
      }
      if (user?.role !== 'CA') {
        Alert.alert('Access Denied', 'Only CA can access this page');
        router.replace('/dashboard');
        return;
      }
      loadUsers();
      loadManagers();
    }
  }, [isAuthenticated, isLoading, user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadManagers = async () => {
    try {
      const response = await api.get('/users');
      const managerList = response.data.filter((u: UserData) => u.role === 'CA' || u.role === 'MANAGER');
      setManagers(managerList);
    } catch (error) {
      console.error('Failed to load managers');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await api.put(`/users/${editingUser.id}`, updateData);
      } else {
        await api.post('/users', formData);
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'STAFF', reportsToId: '' });
      loadUsers();
      Alert.alert('Success', editingUser ? 'User updated successfully' : 'User created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save user');
    }
  };

  const handleEdit = (userData: UserData) => {
    setEditingUser(userData);
    setFormData({
      name: userData.name,
      email: userData.email,
      password: '',
      phone: userData.phone || '',
      role: userData.role,
      reportsToId: userData.reportsTo?.id?.toString() || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/users/${id}`);
              loadUsers();
              Alert.alert('Success', 'User deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      CA: '#a855f7',
      MANAGER: '#3b82f6',
      STAFF: '#6b7280',
    };
    return colors[role] || '#6b7280';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Users</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Users</Text>
        <TouchableOpacity onPress={() => {
          setEditingUser(null);
          setFormData({ name: '', email: '', password: '', phone: '', role: 'STAFF', reportsToId: '' });
          setShowForm(true);
        }}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUsers} />}
      >
        {users.map((userData) => (
          <View key={userData.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleSection}>
                <Text style={styles.cardTitle}>{userData.name}</Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userData.role) + '20' }]}>
                  <Text style={[styles.roleBadgeText, { color: getRoleColor(userData.role) }]}>
                    {userData.role}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(userData)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(userData.id)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cardEmail}>{userData.email}</Text>
            {userData.phone && <Text style={styles.cardPhone}>{userData.phone}</Text>}
            {userData.reportsTo && (
              <Text style={styles.cardReportsTo}>Reports to: {userData.reportsTo.name}</Text>
            )}
            <View style={[styles.statusBadge, { backgroundColor: userData.status === 'ACTIVE' ? '#10b98120' : '#ef444420' }]}>
              <Text style={[styles.statusBadgeText, { color: userData.status === 'ACTIVE' ? '#10b981' : '#ef4444' }]}>
                {userData.status}
              </Text>
            </View>
          </View>
        ))}
        {users.length === 0 && (
          <Text style={styles.emptyText}>No users found</Text>
        )}
      </ScrollView>

      {/* Add/Edit User Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowForm(false);
                setEditingUser(null);
                setFormData({ name: '', email: '', password: '', phone: '', role: 'STAFF', reportsToId: '' });
              }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder={editingUser ? 'New Password (leave empty to keep current)' : 'Password *'}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Role *</Text>
                <View style={styles.roleButtons}>
                  {['STAFF', 'MANAGER'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        formData.role === role && styles.roleButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, role })}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          formData.role === role && styles.roleButtonTextActive,
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {formData.role !== 'CA' && (
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Reports To</Text>
                  <ScrollView style={styles.pickerScroll}>
                    {managers.map((manager) => (
                      <TouchableOpacity
                        key={manager.id}
                        style={[
                          styles.pickerOption,
                          formData.reportsToId === manager.id.toString() && styles.pickerOptionActive,
                        ]}
                        onPress={() => setFormData({ ...formData, reportsToId: manager.id.toString() })}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            formData.reportsToId === manager.id.toString() && styles.pickerOptionTextActive,
                          ]}
                        >
                          {manager.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setFormData({ name: '', email: '', password: '', phone: '', role: 'STAFF', reportsToId: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>
                  {editingUser ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    color: '#0284c7',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    color: '#0284c7',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  cardEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardReportsTo: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 32,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  roleButtonActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  roleButtonTextActive: {
    color: 'white',
  },
  pickerScroll: {
    maxHeight: 150,
  },
  pickerOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  pickerOptionActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#1f2937',
  },
  pickerOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#0284c7',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

