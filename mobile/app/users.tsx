import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  reportsTo?: { id: string; name: string };
}

export default function UsersScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'STAFF' });

  // Filter users based on search
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Only CA can access this page
    if (user?.role !== 'CA') {
      Alert.alert('Access Denied', 'Only CA can manage users');
      router.back();
      return;
    }
    loadUsers();
  }, [isAuthenticated, user]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    if (!editingUser && !formData.password) {
      Alert.alert('Error', 'Password is required for new users');
      return;
    }
    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await api.put(`/users/${editingUser.id}`, updateData);
        Alert.alert('Success', 'User updated successfully');
      } else {
        await api.post('/users', formData);
        Alert.alert('Success', 'User created successfully');
      }
      closeForm();
      loadUsers();
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
    });
    setShowForm(true);
  };

  const handleDelete = (userData: UserData) => {
    if (userData.id === user?.id) {
      Alert.alert('Error', 'You cannot delete your own account');
      return;
    }
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${userData.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/users/${userData.id}`);
              Alert.alert('Success', 'User deleted successfully');
              loadUsers();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (userData: UserData) => {
    if (userData.id === user?.id) {
      Alert.alert('Error', 'You cannot change your own status');
      return;
    }

    const newStatus = userData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    Alert.alert(
      `${newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} User`,
      `Are you sure you want to ${newStatus === 'ACTIVE' ? 'activate' : 'deactivate'} "${userData.name}"?${newStatus === 'INACTIVE' ? '\n\nThis user will not be able to log in.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate',
          style: newStatus === 'ACTIVE' ? 'default' : 'destructive',
          onPress: async () => {
            setTogglingStatus(userData.id);
            try {
              await api.put(`/users/${userData.id}`, { status: newStatus });
              Alert.alert('Success', `User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`);
              loadUsers();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to update user status');
            } finally {
              setTogglingStatus(null);
            }
          },
        },
      ]
    );
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', phone: '', role: 'STAFF' });
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = { CA: '#a855f7', MANAGER: '#3b82f6', STAFF: '#6b7280' };
    return colors[role] || '#6b7280';
  };

  if (!isAuthenticated || user?.role !== 'CA' || loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </SafeAreaView>
    );
  }

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    inactive: users.filter(u => u.status === 'INACTIVE').length,
    managers: users.filter(u => u.role === 'MANAGER').length,
    staff: users.filter(u => u.role === 'STAFF').length,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')} style={styles.headerButton}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Users</Text>
          <Text style={styles.subtitle}>{users.length} total</Text>
        </View>
        <TouchableOpacity onPress={() => setShowForm(true)} style={styles.headerButton}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
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

      <ScrollView 
        style={styles.container} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUsers} colors={['#0ea5e9']} />}
      >
        {/* Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.inactive}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.managers}</Text>
            <Text style={styles.statLabel}>Managers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#6b7280' }]}>{stats.staff}</Text>
            <Text style={styles.statLabel}>Staff</Text>
          </View>
        </ScrollView>

        {/* User List */}
        <View style={styles.list}>
          {filteredUsers.map((userData) => (
            <View key={userData.id} style={[styles.card, userData.status === 'INACTIVE' && styles.cardInactive]}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatarSmall, userData.status === 'INACTIVE' && styles.avatarInactive]}>
                  <Text style={styles.avatarSmallText}>{userData.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.cardTitle, userData.status === 'INACTIVE' && styles.textInactive]}>
                      {userData.name}
                    </Text>
                    {userData.id === user?.id && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>You</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userData.role) + '20', borderColor: getRoleColor(userData.role) }]}>
                    <Text style={[styles.roleBadgeText, { color: getRoleColor(userData.role) }]}>{userData.role}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardSubtext}>📧 {userData.email}</Text>
                {userData.phone && <Text style={styles.cardSubtext}>📱 {userData.phone}</Text>}
                {userData.reportsTo && <Text style={styles.cardSubtext}>👤 Reports to: {userData.reportsTo.name}</Text>}
              </View>

              {/* Status Toggle */}
              <View style={styles.statusRow}>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: userData.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2' }]}>
                    <View style={[styles.statusDot, { backgroundColor: userData.status === 'ACTIVE' ? '#22c55e' : '#ef4444' }]} />
                    <Text style={[styles.statusText, { color: userData.status === 'ACTIVE' ? '#16a34a' : '#dc2626' }]}>
                      {userData.status}
                    </Text>
                  </View>
                </View>
                {userData.id !== user?.id && (
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      userData.status === 'ACTIVE' ? styles.toggleDeactivate : styles.toggleActivate
                    ]}
                    onPress={() => handleToggleStatus(userData)}
                    disabled={togglingStatus === userData.id}
                  >
                    {togglingStatus === userData.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.toggleButtonText}>
                        {userData.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(userData)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                {userData.id !== user?.id && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(userData)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {filteredUsers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching users' : 'No users found'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery ? `No users matching "${searchQuery}"` : 'Add your first team member'}
              </Text>
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchLink}>Clear search</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.emptyButton} onPress={() => setShowForm(true)}>
                  <Text style={styles.emptyButtonText}>+ Add User</Text>
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
                {editingUser ? 'Edit User' : 'Add New User'}
              </Text>
              <TouchableOpacity onPress={closeForm}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor="#9ca3af"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor="#9ca3af"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>
                {editingUser ? 'Password (leave blank to keep current)' : 'Password *'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
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

              <Text style={styles.inputLabel}>Role *</Text>
              <View style={styles.roleSelector}>
                {['STAFF', 'MANAGER', 'CA'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleButton,
                      formData.role === role && { backgroundColor: getRoleColor(role) }
                    ]}
                    onPress={() => setFormData({ ...formData, role })}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      formData.role === role && { color: 'white' }
                    ]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>
                  {editingUser ? 'Update User' : 'Create User'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={closeForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
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
  searchContainer: { backgroundColor: 'white', margin: 16, marginBottom: 0, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#0f172a' },
  clearButton: { padding: 8 },
  clearButtonText: { color: '#94a3b8', fontSize: 16 },

  // Stats
  statsContainer: { paddingHorizontal: 16, paddingVertical: 16 },
  statCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginRight: 12, minWidth: 80, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },

  // List
  list: { padding: 16, paddingTop: 0 },
  card: { backgroundColor: 'white', borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, overflow: 'hidden' },
  cardInactive: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatarSmall: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center' },
  avatarInactive: { backgroundColor: '#94a3b8' },
  avatarSmallText: { fontSize: 20, fontWeight: '700', color: 'white' },
  cardInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  textInactive: { color: '#64748b' },
  youBadge: { backgroundColor: '#0ea5e9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  youBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start', marginTop: 6 },
  roleBadgeText: { fontSize: 11, fontWeight: '600' },

  cardBody: { padding: 16, paddingTop: 12, paddingBottom: 12 },
  cardSubtext: { fontSize: 14, color: '#64748b', marginBottom: 6 },

  // Status Row
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fafafa', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  statusInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusLabel: { fontSize: 14, color: '#64748b' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  toggleButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, minWidth: 90, alignItems: 'center' },
  toggleActivate: { backgroundColor: '#22c55e' },
  toggleDeactivate: { backgroundColor: '#ef4444' },
  toggleButtonText: { color: 'white', fontSize: 13, fontWeight: '600' },

  // Card Actions
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
  roleSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  roleButtonText: { fontSize: 14, fontWeight: '600', color: '#64748b' },

  submitButton: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelButton: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
});
