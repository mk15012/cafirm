'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import { User, Mail, Phone, Shield, Building2, Calendar, Edit, Lock, Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  reportsTo?: { id: number; name: string };
  firmAssignments?: Array<{
    id: number;
    firm: {
      id: number;
      name: string;
      client: {
        id: number;
        name: string;
      };
    };
  }>;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user: currentUser, initializeAuth } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'password'>('profile');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      // Load profile for any authenticated user
      loadProfile();
    }
  }, [isAuthenticated, isLoading]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use /auth/me endpoint which allows any authenticated user to view their own profile
      const response = await api.get('/auth/me');
      setProfile(response.data);
      // Initialize edit data
      setEditData({
        name: response.data.name || '',
        phone: response.data.phone || '',
      });
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      setError(error.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSavingProfile(true);
      const response = await api.put('/auth/profile', editData);
      setProfile(response.data);
      toast.success('Profile updated successfully!');
      setActiveTab('profile');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('profile');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (isLoading || loading) {
    return (
      <AppLayout title="Profile">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading profile...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <AppLayout title="Profile">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <Shield className="w-16 h-16 mx-auto mb-2" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadProfile}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <AppLayout title="Profile">
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl">
          {/* Header with Avatar */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-t-2xl p-8 relative">
            <button
              onClick={() => router.back()}
              className="absolute top-6 right-6 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-primary-600 font-bold text-3xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">{profile.name}</h1>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border ${getRoleColor(profile.role)}`}>
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 font-medium text-sm transition-colors relative ${
                  activeTab === 'profile'
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Profile Details
                {activeTab === 'profile' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
              <button
                onClick={() => {
                  setEditData({ name: profile?.name || '', phone: profile?.phone || '' });
                  setActiveTab('edit');
                }}
                className={`px-6 py-4 font-medium text-sm transition-colors relative ${
                  activeTab === 'edit'
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Edit Profile
                {activeTab === 'edit' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`px-6 py-4 font-medium text-sm transition-colors relative ${
                  activeTab === 'password'
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Change Password
                {activeTab === 'password' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                    <p className="text-base font-semibold text-gray-900">{profile.email}</p>
                  </div>
                </div>

                {/* Phone */}
                {profile.phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                      <p className="text-base font-semibold text-gray-900">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {/* Member Since */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">Member Since</p>
                    <p className="text-base font-semibold text-gray-900">{formatDate(profile.createdAt)}</p>
                  </div>
                </div>

                {/* Reports To */}
                {profile.reportsTo && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">Reports To</p>
                      <p className="text-base font-semibold text-gray-900">{profile.reportsTo.name}</p>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">Account Status</p>
                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                      profile.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {profile.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'edit' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Edit className="w-6 h-6 text-primary-600" />
                    <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                  </div>
                  <p className="text-sm text-gray-600">Update your personal information.</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingProfile ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </span>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="w-6 h-6 text-primary-600" />
                    <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                  </div>
                  <p className="text-sm text-gray-600">Update your account password to keep your account secure.</p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-5">
                  {passwordError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{passwordError}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-12"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-12"
                        placeholder="Enter new password (minimum 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-12"
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changingPassword ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Changing...
                        </span>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('profile');
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordError(null);
                      }}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
