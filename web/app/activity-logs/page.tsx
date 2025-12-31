'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import { Activity, Filter, X, User, Calendar, Clock, FileText, CheckCircle, XCircle, Edit, Trash2, Plus } from 'lucide-react';
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
  const { isAuthenticated, isLoading, user, initializeAuth } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    userId: '',
    entityType: '',
    startDate: '',
    endDate: '',
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
      loadLogs();
      loadUsers();
    }
  }, [isAuthenticated, isLoading, user, router, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
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

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800 border-green-200',
      UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
      DELETE: 'bg-red-100 text-red-800 border-red-200',
      APPROVE: 'bg-purple-100 text-purple-800 border-purple-200',
      REJECT: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
        return <Plus className="w-4 h-4" />;
      case 'UPDATE':
        return <Edit className="w-4 h-4" />;
      case 'DELETE':
        return <Trash2 className="w-4 h-4" />;
      case 'APPROVE':
        return <CheckCircle className="w-4 h-4" />;
      case 'REJECT':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    const colors: Record<string, string> = {
      User: 'bg-purple-100 text-purple-800 border-purple-200',
      Client: 'bg-blue-100 text-blue-800 border-blue-200',
      Firm: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      Task: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Invoice: 'bg-green-100 text-green-800 border-green-200',
      Document: 'bg-gray-100 text-gray-800 border-gray-200',
      Approval: 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return colors[entityType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const clearFilters = () => {
    setFilters({ userId: '', entityType: '', startDate: '', endDate: '' });
  };

  const hasActiveFilters = filters.userId || filters.entityType || filters.startDate || filters.endDate;

  if (isLoading || loading) {
    return (
      <AppLayout title="Activity Logs">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading activity logs...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated || user?.role !== 'CA') {
    return null;
  }

  const recentLogs = logs.slice(0, 10);
  const actionCounts = {
    CREATE: logs.filter(l => l.actionType === 'CREATE').length,
    UPDATE: logs.filter(l => l.actionType === 'UPDATE').length,
    DELETE: logs.filter(l => l.actionType === 'DELETE').length,
    APPROVE: logs.filter(l => l.actionType === 'APPROVE').length,
    REJECT: logs.filter(l => l.actionType === 'REJECT').length,
  };

  return (
    <AppLayout title="Activity Logs">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
            <p className="text-sm text-gray-500">Track all system activities and changes</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-primary-100 text-primary-700 border border-primary-300'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-primary-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {[filters.userId, filters.entityType, filters.startDate, filters.endDate].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Logs</p>
          <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Created</p>
          <p className="text-2xl font-bold text-green-600">{actionCounts.CREATE}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Updated</p>
          <p className="text-2xl font-bold text-blue-600">{actionCounts.UPDATE}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Deleted</p>
          <p className="text-2xl font-bold text-red-600">{actionCounts.DELETE}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Approvals</p>
          <p className="text-2xl font-bold text-purple-600">{actionCounts.APPROVE + actionCounts.REJECT}</p>
        </div>
      </div>

      {/* Filters */}
      {(showFilters || hasActiveFilters) && (
        <div className="mb-6 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Activity Logs</h3>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
              <select
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Types</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#111827' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#111827' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity logs found</h3>
            <p className="text-sm text-gray-500">No activities recorded for the selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(log.createdAt), 'HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.user.name}</p>
                          <p className="text-xs text-gray-500">{log.user.email}</p>
                          <span className="text-xs text-primary-600">{log.user.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${getActionColor(log.actionType)}`}>
                        {getActionIcon(log.actionType)}
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getEntityTypeColor(log.entityType)}`}>
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{log.description}</p>
                      <p className="text-xs text-gray-500 mt-1">ID: {log.entityId}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
