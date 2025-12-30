'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { Clock, CheckCircle, XCircle, Filter, X, Building2, User, Calendar, AlertCircle } from 'lucide-react';

interface Approval {
  id: number;
  status: string;
  remarks?: string;
  task: {
    id: number;
    title: string;
    firm: {
      id: number;
      name: string;
      client: { id: number; name: string };
    };
  };
  requestedBy: { id: number; name: string };
  approvedBy?: { id: number; name: string };
  createdAt: string;
  approvedAt?: string;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, initializeAuth } = useAuthStore();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: '' });
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      loadApprovals();
    }
  }, [isAuthenticated, isLoading, router, filters]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      const response = await api.get(`/approvals?${params.toString()}`);
      setApprovals(response.data);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;
    try {
      await api.put(`/approvals/${selectedApproval.id}/approve`, { remarks });
      setSelectedApproval(null);
      setActionType(null);
      setRemarks('');
      loadApprovals();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!selectedApproval || !remarks.trim()) {
      alert('Remarks are required for rejection');
      return;
    }
    try {
      await api.put(`/approvals/${selectedApproval.id}/reject`, { remarks });
      setSelectedApproval(null);
      setActionType(null);
      setRemarks('');
      loadApprovals();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to reject');
    }
  };

  const canApprove = user?.role === 'CA' || user?.role === 'MANAGER';

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const hasActiveFilters = filters.status;
  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;

  if (isLoading || loading) {
    return (
      <AppLayout title="Approvals">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading approvals...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout title="Approvals">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
            <p className="text-sm text-gray-500">
              {pendingCount > 0 ? `${pendingCount} pending approval${pendingCount > 1 ? 's' : ''}` : 'Manage task approvals'}
            </p>
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
        </button>
      </div>

      {/* Summary Card */}
      {pendingCount > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="font-semibold text-yellow-900">You have {pendingCount} pending approval{pendingCount > 1 ? 's' : ''}</p>
            <p className="text-sm text-yellow-700">Review and take action on these requests</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {(showFilters || hasActiveFilters) && (
        <div className="mb-6 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Approvals</h3>
            <button
              onClick={() => {
                setShowFilters(false);
                setFilters({ status: '' });
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {selectedApproval && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h2>
              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setActionType(null);
                  setRemarks('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Task:</p>
              <p className="font-semibold text-gray-900">{selectedApproval.task.title}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks {actionType === 'reject' && '*'}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                required={actionType === 'reject'}
                placeholder={actionType === 'approve' ? 'Optional remarks...' : 'Required remarks for rejection...'}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                  actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionType === 'approve' ? (
                  <>
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Approve
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 inline mr-2" />
                    Reject
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setActionType(null);
                  setRemarks('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approvals List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {approvals.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No approvals found</h3>
            <p className="text-sm text-gray-500">No approval requests at this time</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Firm</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/tasks/${approval.task.id}`}
                        className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                      >
                        {approval.task.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                          <Link
                            href={`/firms/${approval.task.firm.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-primary-600"
                          >
                            {approval.task.firm.name}
                          </Link>
                          <p className="text-xs text-gray-500">{approval.task.firm.client.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{approval.requestedBy.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(approval.status)}`}>
                        {approval.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{format(new Date(approval.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {approval.status === 'PENDING' && canApprove && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedApproval(approval);
                              setActionType('approve');
                            }}
                            className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedApproval(approval);
                              setActionType('reject');
                            }}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                      {approval.remarks && (
                        <span className="text-gray-500" title={approval.remarks}>
                          📝
                        </span>
                      )}
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
