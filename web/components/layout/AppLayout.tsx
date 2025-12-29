'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { format } from 'date-fns';
import api from '@/lib/api';
import {
  CheckSquare, Clock, AlertCircle, FileText, Users, Building2,
  DollarSign, Receipt, Calendar, Activity, User, LogOut, Menu, X, Shield
} from 'lucide-react';

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
  const [firms, setFirms] = useState<Array<{ id: string; name: string; clientId: string }>>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submittingMeeting, setSubmittingMeeting] = useState(false);

  const getCurrentDate = () => {
    return format(new Date(), 'EEEE d MMMM, yyyy');
  };

  // Load clients and firms when meeting modal opens
  useEffect(() => {
    if (showMeetingModal) {
      loadClientsAndFirms();
    }
  }, [showMeetingModal]);

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
      alert('Meeting scheduled successfully! Google Calendar link opened in new tab.');

      // Reset form and close modal
      setMeetingData({ title: '', date: '', time: '', clientId: '', firmId: '', location: '', notes: '' });
      setShowMeetingModal(false);
    } catch (error: any) {
      console.error('Failed to create meeting:', error);
      alert(error.response?.data?.error || 'Failed to schedule meeting. Please try again.');
    } finally {
      setSubmittingMeeting(false);
    }
  };

  // Filter firms based on selected client
  const filteredFirms = meetingData.clientId
    ? firms.filter((firm) => firm.clientId === meetingData.clientId)
    : firms;

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
                <h1 className="font-bold text-lg">CA Firm</h1>
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
            {user?.role === 'CA' && (
              <>
                <NavLink href="/users" icon={User} active={pathname === '/users'}>
                  Users
                </NavLink>
                <NavLink href="/activity-logs" icon={Activity} active={pathname === '/activity-logs'}>
                  Activity Log
                </NavLink>
              </>
            )}
          </nav>

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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
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
                href="/dashboard"
                onClick={() => setShowCAAccess(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Activity className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">Dashboard</p>
                  <p className="text-sm text-gray-500">View all metrics</p>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                  <input
                    type="time"
                    required
                    value={meetingData.time}
                    onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

