'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import { User, Plus, X, Mail, Phone, Shield, UserCheck, Edit, Trash2, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  reportsTo?: { id: string; name: string };
}

export default function UsersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, initializeAuth } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      if (user?.role !== 'CA') {
        router.push('/dashboard');
        return;
      }
      loadUsers();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await api.put(`/users/${editingUser.id}`, updateData);
        toast.success('User updated successfully!');
      } else {
        await api.post('/users', formData);
        toast.success('User created successfully!');
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'STAFF', reportsToId: '' });
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save user');
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
      reportsToId: userData.reportsTo?.id || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully!');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      await api.put(`/users/${id}`, { status: newStatus });
      toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully!`);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user status');
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      CA: 'bg-purple-100 text-purple-800 border-purple-200',
      MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
      STAFF: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isLoading || loading) {
    return (
      <AppLayout title="Users">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading users...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated || user?.role !== 'CA') {
    return null;
  }

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    ca: users.filter(u => u.role === 'CA').length,
    managers: users.filter(u => u.role === 'MANAGER').length,
    staff: users.filter(u => u.role === 'STAFF').length,
  };

  return (
    <AppLayout title="Users">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500">Manage system users and permissions</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', phone: '', role: 'STAFF', reportsToId: '' });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">CA</p>
          <p className="text-2xl font-bold text-purple-600">{stats.ca}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Managers</p>
          <p className="text-2xl font-bold text-blue-600">{stats.managers}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Staff</p>
          <p className="text-2xl font-bold text-gray-600">{stats.staff}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingUser(null);
                setFormData({ name: '', email: '', password: '', phone: '', role: 'STAFF', reportsToId: '' });
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {!editingUser && '*'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Password'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="+91 1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="CA">CA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reports To</label>
                <select
                  value={formData.reportsToId}
                  onChange={(e) => setFormData({ ...formData, reportsToId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">None</option>
                  {users
                    .filter((u) => u.id !== editingUser?.id && (u.role === 'CA' || u.role === 'MANAGER'))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setFormData({ name: '', email: '', password: '', phone: '', role: 'STAFF', reportsToId: '' });
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Grid */}
      {users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-sm text-gray-500 mb-4">Get started by adding your first user</p>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: '', email: '', password: '', phone: '', role: 'STAFF', reportsToId: '' });
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((userData) => (
            <div
              key={userData.id}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{userData.name}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRoleColor(userData.role)}`}>
                      {userData.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(userData)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {String(userData.id) !== String(user?.id) && (
                    <button
                      onClick={() => handleDelete(userData.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{userData.email}</span>
                </div>
                {userData.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{userData.phone}</span>
                  </div>
                )}
                {userData.reportsTo && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserCheck className="w-4 h-4 text-gray-400" />
                    <span>Reports to: {userData.reportsTo.name}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  userData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {userData.status}
                </span>
                {String(userData.id) !== String(user?.id) && (
                  <button
                    onClick={() => handleToggleStatus(userData.id, userData.status)}
                    className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                      userData.status === 'ACTIVE' 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {userData.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
