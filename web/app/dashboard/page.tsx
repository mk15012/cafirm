'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadDashboard();
  }, [isAuthenticated, router]);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/dashboard/metrics');
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">CA Firm Management System</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-gray-600">Good morning, {user?.name}</p>
        </div>

        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Active Tasks"
              value={metrics.activeTasks}
              change={metrics.activeTasksChange}
              changeType="positive"
            />
            <MetricCard
              title="Pending Approvals"
              value={metrics.pendingApprovals}
            />
            <MetricCard
              title="Overdue Items"
              value={metrics.overdueItems}
              change={metrics.overdueItemsChange}
              changeType="negative"
            />
            <MetricCard
              title="Documents"
              value={metrics.documents}
              change={metrics.documentsChange}
              changeType="positive"
            />
            <MetricCard
              title="Active Clients"
              value={metrics.activeClients}
              change={metrics.activeClientsChange}
              changeType="positive"
            />
            <MetricCard
              title="Firms Managed"
              value={metrics.firmsManaged}
              change={metrics.firmsManagedChange}
              changeType="positive"
            />
            {(user?.role === 'CA' || user?.role === 'MANAGER') && (
              <MetricCard
                title="Monthly Revenue"
                value={`₹${metrics.monthlyRevenue.toLocaleString('en-IN')}`}
                change={metrics.monthlyRevenueChange}
                changeType="positive"
              />
            )}
            <MetricCard
              title="Unpaid Invoices"
              value={metrics.unpaidInvoices}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NavCard title="Clients" href="/clients" />
          <NavCard title="Firms" href="/firms" />
          <NavCard title="Tasks" href="/tasks" />
          <NavCard title="Invoices" href="/invoices" />
          <NavCard title="Documents" href="/documents" />
          <NavCard title="Approvals" href="/approvals" />
          {user?.role === 'CA' && (
            <>
              <NavCard title="Users" href="/users" />
              <NavCard title="Activity Log" href="/activity-logs" />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  changeType,
}: {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative';
}) {
  const changeColor =
    changeType === 'positive'
      ? 'text-green-600'
      : changeType === 'negative'
      ? 'text-red-600'
      : 'text-gray-600';

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold">{value}</p>
        {change !== undefined && (
          <span className={`text-sm ${changeColor}`}>
            {change > 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
    </div>
  );
}

function NavCard({ title, href }: { title: string; href: string }) {
  return (
    <a
      href={href}
      className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <h3 className="text-lg font-semibold">{title}</h3>
    </a>
  );
}

