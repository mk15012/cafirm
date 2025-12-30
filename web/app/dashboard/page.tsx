'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  CheckSquare, Clock, AlertCircle, FileText, Users, Building2, 
  DollarSign, Receipt, Calendar, Activity, User, LogOut, Menu, X, Shield
} from 'lucide-react';

interface DashboardMetrics {
  activeTasks: number;
  activeTasksChange: number;
  pendingApprovals: number;
  overdueItems: number;
  overdueItemsChange: number;
  documents: number;
  documentsChange: number;
  activeClients: number;
  activeClientsChange: number;
  firmsManaged: number;
  firmsManagedChange: number;
  monthlyRevenue: number;
  monthlyRevenueChange: number;
  unpaidInvoices: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  firm: {
    id: string;
    name: string;
    client: { id: string; name: string };
  };
  assignedTo: { id: string; name: string };
}

interface Deadline {
  id: string;
  title: string;
  type: string;
  firm: string;
  client: string;
  dueDate: string;
  priority: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, initializeAuth } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
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

  useEffect(() => {
    initializeAuth();
  }, []); // Only run once on mount

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

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      // Load dashboard data when authenticated and not loaded yet
      if (isAuthenticated && !dataLoaded) {
        loadDashboard();
      }
    }
  }, [isAuthenticated, isLoading, dataLoaded]);

  const loadDashboard = async () => {
    if (dataLoaded) return; // Prevent multiple calls
    try {
      setLoading(true);
      console.log('Loading dashboard data...');
      const [metricsRes, tasksRes, deadlinesRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/recent-tasks'),
        api.get('/dashboard/upcoming-deadlines'),
      ]);
      console.log('Dashboard data loaded successfully');
      setMetrics(metricsRes.data);
      setRecentTasks(tasksRes.data || []);
      setUpcomingDeadlines(deadlinesRes.data || []);
      setDataLoaded(true);
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set empty data on error to prevent infinite loading
      setMetrics({
        activeTasks: 0,
        activeTasksChange: 0,
        pendingApprovals: 0,
        overdueItems: 0,
        overdueItemsChange: 0,
        documents: 0,
        documentsChange: 0,
        activeClients: 0,
        activeClientsChange: 0,
        firmsManaged: 0,
        firmsManagedChange: 0,
        monthlyRevenue: 0,
        monthlyRevenueChange: 0,
        unpaidInvoices: 0,
      });
      setRecentTasks([]);
      setUpcomingDeadlines([]);
      setDataLoaded(true); // Mark as loaded even on error to prevent retry loop
    } finally {
      setLoading(false);
    }
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getCurrentDate = () => {
    return format(new Date(), 'EEEE d MMMM, yyyy');
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
            <NavLink href="/dashboard" icon={Activity} active>
              Dashboard
            </NavLink>
            <NavLink href="/tasks" icon={CheckSquare}>Tasks</NavLink>
            <NavLink href="/documents" icon={FileText}>Documents</NavLink>
            <NavLink href="/clients" icon={Users}>Clients</NavLink>
            <NavLink href="/firms" icon={Building2}>Firms</NavLink>
            <NavLink href="/invoices" icon={Receipt}>Invoices</NavLink>
            <NavLink href="/approvals" icon={Clock}>Approvals</NavLink>
            {user?.role === 'CA' && (
              <>
                <NavLink href="/users" icon={User}>Users</NavLink>
                <NavLink href="/activity-logs" icon={Activity}>Activity Log</NavLink>
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
                    Dashboard
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
                <Link
                  href="/profile"
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity rounded-lg p-2 -m-2"
                >
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                </Link>
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

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">
              {getCurrentGreeting()}, {user?.name}!
            </h1>
            <p className="text-primary-100 text-lg">
              Here's what's happening with your firm today • {getCurrentDate()}
            </p>
          </div>

          {/* Metrics Grid */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                icon={CheckSquare}
                title="Active Tasks"
                value={metrics.activeTasks}
                change={metrics.activeTasksChange}
                changeType="positive"
                description="Tasks in progress"
                iconColor="text-blue-600"
                bgColor="bg-blue-50"
              />
              <MetricCard
                icon={Clock}
                title="Pending Approvals"
                value={metrics.pendingApprovals}
                description="Awaiting approval"
                iconColor="text-purple-600"
                bgColor="bg-purple-50"
              />
              <MetricCard
                icon={AlertCircle}
                title="Overdue Items"
                value={metrics.overdueItems}
                change={metrics.overdueItemsChange}
                changeType="negative"
                description="Past due date"
                iconColor="text-red-600"
                bgColor="bg-red-50"
              />
              <MetricCard
                icon={FileText}
                title="Documents"
                value={metrics.documents}
                change={metrics.documentsChange}
                changeType="positive"
                description="Total documents"
                iconColor="text-green-600"
                bgColor="bg-green-50"
              />
              <MetricCard
                icon={Users}
                title="Active Clients"
                value={metrics.activeClients}
                change={metrics.activeClientsChange}
                changeType="positive"
                description="Total clients"
                iconColor="text-indigo-600"
                bgColor="bg-indigo-50"
              />
              <MetricCard
                icon={Building2}
                title="Firms Managed"
                value={metrics.firmsManaged}
                change={metrics.firmsManagedChange}
                changeType="positive"
                description="Across all clients"
                iconColor="text-cyan-600"
                bgColor="bg-cyan-50"
              />
              {(user?.role === 'CA' || user?.role === 'MANAGER') && (
                <MetricCard
                  icon={DollarSign}
                  title="Monthly Revenue"
                  value={`₹${metrics.monthlyRevenue.toLocaleString('en-IN')}`}
                  change={metrics.monthlyRevenueChange}
                  changeType="positive"
                  description="Current month"
                  iconColor="text-emerald-600"
                  bgColor="bg-emerald-50"
                />
              )}
              <MetricCard
                icon={Receipt}
                title="Unpaid Invoices"
                value={metrics.unpaidInvoices}
                description="Total outstanding"
                iconColor="text-orange-600"
                bgColor="bg-orange-50"
              />
            </div>
          )}

          {/* Recent Tasks and Upcoming Deadlines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Tasks */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="w-6 h-6 text-primary-600" />
                  Recent Tasks
                </h3>
                <Link href="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors">
                  View All
                  <span>→</span>
                </Link>
              </div>
              <div className="space-y-4">
                {recentTasks.length > 0 ? (
                  recentTasks.slice(0, 5).map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No recent tasks</p>
                    <Link href="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
                      Create your first task →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                  Upcoming Deadlines
                </h3>
                <span className="text-xs text-gray-500">Next 30 days</span>
              </div>
              <div className="space-y-4">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.slice(0, 5).map((deadline, index) => (
                    <DeadlineCard key={index} deadline={deadline} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No upcoming deadlines</p>
                    <p className="text-xs text-gray-400 mt-2">You're all caught up!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
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

function MetricCard({
  icon: Icon,
  title,
  value,
  change,
  changeType,
  description,
  iconColor,
  bgColor,
}: {
  icon: any;
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative';
  description?: string;
  iconColor: string;
  bgColor: string;
}) {
  const changeColor =
    changeType === 'positive'
      ? 'text-green-600 bg-green-50'
      : changeType === 'negative'
      ? 'text-red-600 bg-red-50'
      : 'text-gray-600 bg-gray-50';

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 ${bgColor} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>
        {change !== undefined && (
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${changeColor}`}>
            {change > 0 ? '↑' : change < 0 ? '↓' : ''}
            {change !== 0 && `${Math.abs(change)}%`}
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{title}</h3>
      <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
      {description && <p className="text-xs text-gray-500 font-medium">{description}</p>}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
  const statusColors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    AWAITING_APPROVAL: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
  };

  return (
    <Link href={`/tasks/${task.id}`} className="block p-4 border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-bold text-gray-900 flex-1 group-hover:text-primary-700 transition-colors">{task.title}</h4>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColors[task.status] || 'bg-gray-100 text-gray-800'}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
      <div className="space-y-1.5 mb-3">
        <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-gray-400" />
          {task.firm.client.name} • {task.firm.name}
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <User className="w-3.5 h-3.5" />
          {task.assignedTo.name}
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
        </p>
      </div>
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {isOverdue && (
          <span className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
            Overdue
          </span>
        )}
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
          task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {task.priority}
        </span>
      </div>
    </Link>
  );
}

function DeadlineCard({ deadline }: { deadline: Deadline }) {
  const priorityColors: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-green-100 text-green-800',
  };

  const daysUntilDue = Math.ceil((new Date(deadline.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntilDue <= 7;

  return (
    <div className={`p-4 border rounded-lg transition-all duration-200 ${
      isUrgent 
        ? 'border-red-200 bg-red-50 hover:bg-red-100' 
        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className={`font-bold text-gray-900 flex-1 ${isUrgent ? 'text-red-900' : ''}`}>
          {deadline.title}
        </h4>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${priorityColors[deadline.priority] || 'bg-gray-100 text-gray-800'}`}>
          {deadline.priority.toLowerCase()}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-gray-400" />
          {deadline.client} • {deadline.firm}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(deadline.dueDate), 'MMM d, yyyy')}
          </p>
          {isUrgent && (
            <span className="text-xs font-semibold text-red-700">
              {daysUntilDue === 0 ? 'Due today!' : `${daysUntilDue} days left`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
