import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator } from 'react-native';
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
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'STAFF' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
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
      } else {
        await api.post('/users', formData);
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'STAFF' });
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

  const handleDelete = (id: string) => {
    Alert.alert('Delete User', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/users/${id}`);
            loadUsers();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to delete user');
          }
        },
      },
    ]);
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
    ca: users.filter(u => u.role === 'CA').length,
    managers: users.filter(u => u.role === 'MANAGER').length,
    staff: users.filter(u => u.role === 'STAFF').length,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUsers} colors={['#0ea5e9']} />}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Users</Text>
          <TouchableOpacity onPress={() => { setEditingUser(null); setFormData({ name: '', email: '', password: '', phone: '', role: 'STAFF' }); setShowForm(!showForm); }}>
            <Text style={styles.addButton}>{showForm ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          <View style={styles.statCard}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10b981' }]}>{stats.active}</Text><Text style={styles.statLabel}>Active</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#a855f7' }]}>{stats.ca}</Text><Text style={styles.statLabel}>CA</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.managers}</Text><Text style={styles.statLabel}>Managers</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#6b7280' }]}>{stats.staff}</Text><Text style={styles.statLabel}>Staff</Text></View>
        </ScrollView>

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{editingUser ? 'Edit User' : 'Add New User'}</Text>
            <TextInput style={styles.input} placeholder="Name *" placeholderTextColor="#9ca3af" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
            <TextInput style={styles.input} placeholder="Email *" placeholderTextColor="#9ca3af" value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder={editingUser ? "Password (leave blank to keep)" : "Password *"} placeholderTextColor="#9ca3af" value={formData.password} onChangeText={(text) => setFormData({ ...formData, password: text })} secureTextEntry />
            <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#9ca3af" value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} keyboardType="phone-pad" />
            <View style={styles.roleSelector}>
              {['STAFF', 'MANAGER', 'CA'].map((role) => (
                <TouchableOpacity key={role} style={[styles.roleButton, formData.role === role && { backgroundColor: getRoleColor(role) }]} onPress={() => setFormData({ ...formData, role })}>
                  <Text style={[styles.roleButtonText, formData.role === role && { color: 'white' }]}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>{editingUser ? 'Update User' : 'Create User'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.list}>
          {users.map((userData) => (
            <View key={userData.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarSmallText}>{userData.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{userData.name}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userData.role) + '20', borderColor: getRoleColor(userData.role) }]}>
                    <Text style={[styles.roleBadgeText, { color: getRoleColor(userData.role) }]}>{userData.role}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleEdit(userData)} style={styles.actionButton}>
                    <Text style={styles.editText}>✏️</Text>
                  </TouchableOpacity>
                  {userData.id !== user?.id && (
                    <TouchableOpacity onPress={() => handleDelete(userData.id)} style={styles.actionButton}>
                      <Text style={styles.deleteText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.cardSubtext}>📧 {userData.email}</Text>
              {userData.phone && <Text style={styles.cardSubtext}>📱 {userData.phone}</Text>}
              {userData.reportsTo && <Text style={styles.cardSubtext}>👤 Reports to: {userData.reportsTo.name}</Text>}
              <View style={[styles.statusBadge, { backgroundColor: userData.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6' }]}>
                <Text style={[styles.statusText, { color: userData.status === 'ACTIVE' ? '#059669' : '#6b7280' }]}>{userData.status}</Text>
              </View>
            </View>
          ))}
          {users.length === 0 && <Text style={styles.emptyText}>No users found</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
  container: { flex: 1 },
  header: { backgroundColor: '#0f172a', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { color: '#0ea5e9', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  addButton: { color: '#0ea5e9', fontSize: 16, fontWeight: '600' },
  statsContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  statCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginRight: 12, minWidth: 80, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  form: { backgroundColor: 'white', margin: 16, padding: 16, borderRadius: 12 },
  formTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#0f172a' },
  input: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16, color: '#0f172a' },
  roleSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center' },
  roleButtonText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  submitButton: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  list: { padding: 16 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarSmall: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarSmallText: { fontSize: 20, fontWeight: '700', color: 'white' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start' },
  roleBadgeText: { fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionButton: { padding: 8 },
  editText: { fontSize: 18 },
  deleteText: { fontSize: 18 },
  cardSubtext: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 32 },
});
