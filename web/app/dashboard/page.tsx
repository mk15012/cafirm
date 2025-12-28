'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  CheckSquare, Clock, AlertCircle, FileText, Users, Building2, 
  DollarSign, Receipt, Calendar, Activity, User, LogOut, Menu, X 
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
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []); // Only run once on mount

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      if (isAuthenticated && metrics === null && !loading) {
        loadDashboard();
      }
    }
  }, [isAuthenticated, isLoading]);

  const loadDashboard = async () => {
    try {
      const [metricsRes, tasksRes, deadlinesRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/recent-tasks'),
        api.get('/dashboard/upcoming-deadlines'),
      ]);
      setMetrics(metricsRes.data);
      setRecentTasks(tasksRes.data);
      setUpcomingDeadlines(deadlinesRes.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
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

          <div className="p-4 border-t border-slate-800">
            <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
              CA Access
            </button>
          </div>
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
                    {getCurrentGreeting()}, CA {user?.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Chartered Accountant • {getCurrentDate()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
                <Link href="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  View All
                  <span>→</span>
                </Link>
              </div>
              <div className="space-y-4">
                {recentTasks.slice(0, 2).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {recentTasks.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No recent tasks</p>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Upcoming Deadlines
                </h3>
              </div>
              <div className="space-y-4">
                {upcomingDeadlines.slice(0, 3).map((deadline, index) => (
                  <DeadlineCard key={index} deadline={deadline} />
                ))}
                {upcomingDeadlines.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No upcoming deadlines</p>
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {change !== undefined && (
          <span className={`px-2 py-1 text-xs font-semibold rounded ${changeColor}`}>
            {change > 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {description && <p className="text-xs text-gray-500">{description}</p>}
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
    <Link href={`/tasks/${task.id}`} className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 flex-1">{task.title}</h4>
        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[task.status] || 'bg-gray-100 text-gray-800'}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{task.firm.client.name}</p>
      <p className="text-xs text-gray-500 mb-2">Assigned to: {task.assignedTo.name}</p>
      <p className="text-xs text-gray-500 mb-2">Due Date: {format(new Date(task.dueDate), 'M/d/yyyy')}</p>
      {task.description && (
        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        {isOverdue && (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
            Overdue
          </span>
        )}
        <span className={`px-2 py-1 text-xs font-medium rounded ${
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

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{deadline.title}</h4>
        <span className={`px-2 py-1 text-xs font-medium rounded ${priorityColors[deadline.priority] || 'bg-gray-100 text-gray-800'}`}>
          {deadline.priority.toLowerCase()}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-1">{deadline.client}</p>
      <p className="text-xs text-gray-500">Due Date: {format(new Date(deadline.dueDate), 'M/d/yyyy')}</p>
    </div>
  );
}
