'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';

interface Approval {
  id: string;
  status: string;
  remarks?: string;
  task: {
    id: string;
    title: string;
    firm: {
      id: string;
      name: string;
      client: { id: string; name: string };
    };
  };
  requestedBy: { id: string; name: string };
  approvedBy?: { id: string; name: string };
  createdAt: string;
  approvedAt?: string;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '' });
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadApprovals();
  }, [isAuthenticated, router, filters]);

  const loadApprovals = async () => {
    try {
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
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isAuthenticated || loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-700">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">Approvals</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Action Modal */}
        {selectedApproval && actionType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">
                {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h2>
              <p className="mb-4">Task: {selectedApproval.task.title}</p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Remarks {actionType === 'reject' && '*'}</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  required={actionType === 'reject'}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={actionType === 'approve' ? handleApprove : handleReject}
                  className={`px-4 py-2 rounded text-white ${
                    actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setSelectedApproval(null);
                    setActionType(null);
                    setRemarks('');
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvals.map((approval) => (
                <tr key={approval.id}>
                  <td className="px-6 py-4">
                    <Link href={`/tasks/${approval.task.id}`} className="text-primary-600 hover:underline font-medium">
                      {approval.task.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/firms/${approval.task.firm.id}`} className="text-primary-600 hover:underline">
                      {approval.task.firm.name}
                    </Link>
                    <p className="text-xs text-gray-500">{approval.task.firm.client.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{approval.requestedBy.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(approval.status)}`}>
                      {approval.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(approval.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {approval.status === 'PENDING' && canApprove && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedApproval(approval);
                            setActionType('approve');
                          }}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApproval(approval);
                            setActionType('reject');
                          }}
                          className="text-red-600 hover:text-red-900 mr-3"
                        >
                          Reject
                        </button>
                      </>
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
          {approvals.length === 0 && (
            <div className="text-center py-8 text-gray-500">No approvals found</div>
          )}
        </div>
      </main>
    </div>
  );
}

