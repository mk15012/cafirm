'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string;
  description: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

export default function ActivityLogsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    entityType: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user?.role !== 'CA') {
      router.push('/dashboard');
      return;
    }
    loadLogs();
  }, [isAuthenticated, user, router, filters]);

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const response = await api.get(`/activity-logs?${params.toString()}`);
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      APPROVE: 'bg-purple-100 text-purple-800',
      REJECT: 'bg-orange-100 text-orange-800',
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  if (!isAuthenticated || user?.role !== 'CA' || loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-700">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">Activity Logs</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Entity Type</label>
              <select
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All</option>
                <option value="User">User</option>
                <option value="Client">Client</option>
                <option value="Firm">Firm</option>
                <option value="Task">Task</option>
                <option value="Invoice">Invoice</option>
                <option value="Document">Document</option>
                <option value="Approval">Approval</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Actions</label>
              <button
                onClick={() => setFilters({ userId: '', entityType: '', startDate: '', endDate: '' })}
                className="w-full px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium">{log.user.name}</p>
                      <p className="text-xs text-gray-500">{log.user.email}</p>
                      <span className="text-xs text-blue-600">{log.user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${getActionColor(log.actionType)}`}>
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                      {log.entityType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{log.description}</p>
                    <p className="text-xs text-gray-500">ID: {log.entityId}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">No activity logs found</div>
          )}
        </div>
      </main>
    </div>
  );
}

