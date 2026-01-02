'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { format } from 'date-fns';
import api from '@/lib/api';
import {
  CheckSquare, Clock, AlertCircle, FileText, Users, Building2,
  DollarSign, Receipt, Calendar, Activity, User, LogOut, Menu, X, Shield, Lock, Eye, EyeOff, Mail, Phone,
  Calculator, Key, Wrench, BarChart3, Package, CreditCard, Settings
} from 'lucide-react';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import ConfirmModal from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCAAccess, setShowCAAccess] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [meetingData, setMeetingData] = useState({
    title: '',
    date: '',
    time: '',
    clientId: '',
    firmId: '',
    location: '',
    notes: '',
  });
  const [clients, setClients] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  const [firms, setFirms] = useState<Array<{ id: string; name: string; clientId?: number; client?: { id: number; name: string } }>>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submittingMeeting, setSubmittingMeeting] = useState(false);
  
  // Profile modal states
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'password'>('profile');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [editData, setEditData] = useState({ name: '', phone: '', birthday: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getCurrentDate = () => {
    return format(new Date(), 'EEEE d MMMM, yyyy');
  };

  // Load clients and firms when meeting modal opens
  useEffect(() => {
    if (showMeetingModal) {
      loadClientsAndFirms();
    }
  }, [showMeetingModal]);

  // Load profile when profile modal opens
  useEffect(() => {
    if (showProfileModal && user?.id) {
      loadProfile();
    }
  }, [showProfileModal, user]);

  const loadClientsAndFirms = async () => {
    setLoadingClients(true);
    try {
      const [clientsRes, firmsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/firms'),
      ]);
      setClients(clientsRes.data || []);
      setFirms(firmsRes.data || []);
    } catch (error) {
      console.error('Failed to load clients/firms:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingMeeting(true);
    try {
      const response = await api.post('/meetings', {
        title: meetingData.title,
        description: meetingData.notes,
        clientId: meetingData.clientId || null,
        firmId: meetingData.firmId || null,
        date: meetingData.date,
        time: meetingData.time,
        location: meetingData.location || null,
        notes: meetingData.notes || null,
      });

      // Open Google Calendar link in new tab
      if (response.data.googleCalendarLink) {
        window.open(response.data.googleCalendarLink, '_blank');
      }

      // Show success message
      toast.success('Meeting scheduled successfully! 📅 Google Calendar link opened in new tab.');

      // Reset form and close modal
      setMeetingData({ title: '', date: '', time: '', clientId: '', firmId: '', location: '', notes: '' });
      setShowMeetingModal(false);
    } catch (error: any) {
      console.error('Failed to create meeting:', error);
      toast.error(error.response?.data?.error || 'Failed to schedule meeting. Please try again.');
    } finally {
      setSubmittingMeeting(false);
    }
  };

  // Filter firms based on selected client
  const filteredFirms = meetingData.clientId
    ? firms.filter((firm) => {
        const firmClientId = firm.client?.id || firm.clientId;
        return String(firmClientId) === String(meetingData.clientId);
      })
    : firms;

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      setLoadingProfile(true);
      // Use /auth/me endpoint which works for any authenticated user
      const response = await api.get('/auth/me');
      setProfile(response.data);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoadingProfile(false);
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
      toast.success('Password changed successfully! 🔐');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('profile');
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editData.name.trim()) {
      setEditError('Name cannot be empty');
      return;
    }

    try {
      setSavingProfile(true);
      const response = await api.put('/auth/profile', editData);
      setProfile(response.data);
      toast.success('Profile updated successfully! ✨');
      setActiveTab('profile');
    } catch (error: any) {
      setEditError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg">CA Firm Pro</h1>
                <p className="text-xs text-slate-400">Management System</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">
              MAIN NAVIGATION
            </p>
            <NavLink href="/dashboard" icon={Activity} active={pathname === '/dashboard'}>
              Dashboard
            </NavLink>
            <NavLink href="/tasks" icon={CheckSquare} active={pathname === '/tasks' || pathname?.startsWith('/tasks/')}>
              Tasks
            </NavLink>
            <NavLink href="/documents" icon={FileText} active={pathname === '/documents'}>
              Documents
            </NavLink>
            <NavLink href="/clients" icon={Users} active={pathname === '/clients' || pathname?.startsWith('/clients/')}>
              Clients
            </NavLink>
            <NavLink href="/firms" icon={Building2} active={pathname === '/firms' || pathname?.startsWith('/firms/')}>
              Firms
            </NavLink>
            <NavLink href="/invoices" icon={Receipt} active={pathname === '/invoices'}>
              Invoices
            </NavLink>
            <NavLink href="/approvals" icon={Clock} active={pathname === '/approvals'}>
              Approvals
            </NavLink>
            <NavLink href="/compliance" icon={Calendar} active={pathname === '/compliance'}>
              Compliance
            </NavLink>
            {user?.role === 'CA' && (
              <>
                <NavLink href="/users" icon={User} active={pathname === '/users'}>
                  Users
                </NavLink>
                <NavLink href="/activity-logs" icon={Activity} active={pathname === '/activity-logs'}>
                  Activity Log
                </NavLink>
                <NavLink href="/reports" icon={BarChart3} active={pathname === '/reports'}>
                  Reports
                </NavLink>
              </>
            )}

            {/* Tools Section */}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-6 px-3">
              TOOLS
            </p>
            <NavLink href="/tools/tax-calculator" icon={Calculator} active={pathname === '/tools/tax-calculator'}>
              Tax Calculator
            </NavLink>
            <NavLink href="/tools/credentials" icon={Key} active={pathname === '/tools/credentials'}>
              Portal Credentials
            </NavLink>

            {/* Settings Section - CA Only */}
            {user?.role === 'CA' && (
              <>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-6 px-3">
                  SETTINGS
                </p>
                <NavLink href="/settings/services" icon={Package} active={pathname === '/settings/services'}>
                  Services & Pricing
                </NavLink>
                <NavLink href="/settings/subscription" icon={CreditCard} active={pathname === '/settings/subscription'}>
                  Subscription
                </NavLink>
              </>
            )}
          </nav>

          {/* Subscription Status */}
          {user?.role === 'CA' && (
            <div className="p-4 border-t border-slate-800">
              <SubscriptionBadge />
            </div>
          )}

          {user?.role === 'CA' && (
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={() => setShowCAAccess(true)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                CA Access
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
                >
                  {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {title || 'Dashboard'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {user?.role === 'CA' ? 'Chartered Accountant' : user?.role} • {getCurrentDate()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Meeting
                </button>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity rounded-lg p-2 -m-2"
                >
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* CA Access Modal */}
      {showCAAccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">CA Access</h2>
                  <p className="text-sm text-gray-500">Quick access to CA features</p>
                </div>
              </div>
              <button
                onClick={() => setShowCAAccess(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <Link
                href="/users"
                onClick={() => setShowCAAccess(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <User className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">User Management</p>
                  <p className="text-sm text-gray-500">Manage system users</p>
                </div>
              </Link>
              <Link
                href="/activity-logs"
                onClick={() => setShowCAAccess(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Activity className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Activity Logs</p>
                  <p className="text-sm text-gray-500">View system activity</p>
                </div>
              </Link>
              <Link
                href="/tools/credentials"
                onClick={() => setShowCAAccess(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Key className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Portal Credentials</p>
                  <p className="text-sm text-gray-500">Store client govt portal logins</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Schedule Meeting</h2>
                  <p className="text-sm text-gray-500">Create a new meeting</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMeetingModal(false);
                  setMeetingData({ title: '', date: '', time: '', clientId: '', firmId: '', location: '', notes: '' });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleMeetingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Title *</label>
                <input
                  type="text"
                  required
                  value={meetingData.title}
                  onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Client Consultation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client (Optional)</label>
                <select
                  value={meetingData.clientId}
                  onChange={(e) => {
                    setMeetingData({ ...meetingData, clientId: e.target.value, firmId: '' });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.email ? `(${client.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {meetingData.clientId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Firm (Optional)</label>
                  {filteredFirms.length > 0 ? (
                    <select
                      value={meetingData.firmId}
                      onChange={(e) => setMeetingData({ ...meetingData, firmId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select a firm...</option>
                      {filteredFirms.map((firm) => (
                        <option key={firm.id} value={firm.id}>
                          {firm.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500 italic py-2">No firms found for this client. Create a firm first.</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={meetingData.date}
                    onChange={(e) => setMeetingData({ ...meetingData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                    style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#111827' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                  <input
                    type="time"
                    required
                    value={meetingData.time}
                    onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                    style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#111827' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                <input
                  type="text"
                  value={meetingData.location}
                  onChange={(e) => setMeetingData({ ...meetingData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Office, Video Call, Client Location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes / Agenda</label>
                <textarea
                  value={meetingData.notes}
                  onChange={(e) => setMeetingData({ ...meetingData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Meeting agenda, discussion points, or notes..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submittingMeeting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingMeeting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Schedule Meeting
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMeetingModal(false);
                    setMeetingData({ title: '', date: '', time: '', clientId: '', firmId: '', location: '', notes: '' });
                  }}
                  disabled={submittingMeeting}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                After scheduling, a Google Calendar link will open in a new tab
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowProfileModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {loadingProfile ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading profile...</p>
              </div>
            ) : profile ? (
              <>
                {/* Header with Avatar */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-t-2xl p-8 relative">
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      setActiveTab('profile');
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError(null);
                    }}
                    className="absolute top-6 right-6 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
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
                        setEditData({ 
                          name: profile?.name || '', 
                          phone: profile?.phone || '',
                          birthday: profile?.birthday ? profile.birthday.split('T')[0] : '',
                        });
                        setEditError(null);
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

                      {/* Birthday */}
                      {profile.birthday && (
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🎂</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500 mb-1">Birthday</p>
                            <p className="text-base font-semibold text-gray-900">{formatDate(profile.birthday)}</p>
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
                          <User className="w-6 h-6 text-primary-600" />
                          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                        </div>
                        <p className="text-sm text-gray-600">Update your personal information.</p>
                      </div>

                      <form onSubmit={handleProfileUpdate} className="space-y-5">
                        {editError && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{editError}</p>
                          </div>
                        )}

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
                            placeholder="Your full name"
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
                            placeholder="+91 1234567890"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            🎂 Birthday
                          </label>
                          <input
                            type="date"
                            value={editData.birthday}
                            onChange={(e) => setEditData({ ...editData, birthday: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            style={{ colorScheme: 'light' }}
                          />
                          <p className="text-xs text-gray-500 mt-1">Add your birthday to receive greetings from the team! 🎉</p>
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
                            onClick={() => {
                              setActiveTab('profile');
                              setEditError(null);
                            }}
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
              </>
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-600">Failed to load profile</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to sign in again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
}

function NavLink({ href, icon: Icon, children, active }: { href: string; icon: any; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{children}</span>
    </Link>
  );
}

