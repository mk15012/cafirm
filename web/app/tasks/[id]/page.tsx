'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { 
  CheckSquare, 
  ArrowLeft, 
  Calendar, 
  User, 
  Building2, 
  AlertCircle, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  Edit
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  firm: {
    id: number;
    name: string;
    client: {
      id: number;
      name: string;
    };
  };
  assignedTo: {
    id: number;
    name: string;
    email: string;
  };
  createdBy: {
    id: number;
    name: string;
  };
  approval?: {
    id: number;
    status: string;
    remarks?: string;
    createdAt: string;
    approvedAt?: string;
  };
  documents: Array<{
    id: number;
    fileName: string;
    documentType: string;
    createdAt: string;
  }>;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (params.id) {
      loadTask();
    } else {
      setError('Task ID is missing');
      setLoading(false);
    }
  }, [params.id, isAuthenticated, router]);

  const loadTask = async () => {
    if (!params.id) {
      setError('Task ID is missing');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/tasks/${params.id}`);
      setTask(response.data);
    } catch (error: any) {
      console.error('Failed to load task:', error);
      setError(error.response?.data?.error || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await api.put(`/tasks/${params.id}`, { status: newStatus });
      toast.success('Task status updated!');
      loadTask();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update task status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
      AWAITING_APPROVAL: 'bg-purple-100 text-purple-800 border-purple-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      ERROR: 'bg-red-100 text-red-800 border-red-200',
      OVERDUE: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      HIGH: 'bg-red-100 text-red-800 border-red-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LOW: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && task?.status !== 'COMPLETED';
  };

  const canUpdateStatus = () => {
    if (!task || !user) return false;
    // Assigned user can update status, or CA/Manager can update any task
    return task.assignedTo.id === user.id || user.role === 'CA' || user.role === 'MANAGER';
  };

  if (loading) {
    return (
      <AppLayout title="Task Details">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading task...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !task) {
    return (
      <AppLayout title="Task Details">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Task</h1>
              <p className="text-gray-600 mb-4">{error || 'Task not found'}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={loadTask}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Go Back
                </button>
                <Link
                  href="/tasks"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Tasks
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const overdue = isOverdue(task.dueDate);

  return (
    <AppLayout title="Task Details">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                    {task.priority} Priority
                  </span>
                  {overdue && (
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Overdue
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {canUpdateStatus() && (
            <div className="flex gap-2">
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className={`px-4 py-2 text-sm font-semibold rounded-lg border ${getStatusColor(task.status)} focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer disabled:opacity-50`}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="AWAITING_APPROVAL">Awaiting Approval</option>
                <option value="COMPLETED">Completed</option>
                <option value="ERROR">Error</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Documents</h2>
              <Link
                href={`/documents?taskId=${task.id}`}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </Link>
            </div>
            {task.documents.length > 0 ? (
              <div className="space-y-2">
                {task.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                      <p className="text-xs text-gray-500">{doc.documentType} • {format(new Date(doc.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No documents attached to this task.</p>
            )}
          </div>

          {/* Approval Status */}
          {task.approval && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Approval Request</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${
                    task.approval.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-200' :
                    task.approval.status === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }`}>
                    {task.approval.status}
                  </span>
                  {task.approval.createdAt && (
                    <span className="text-sm text-gray-500">
                      Requested on {format(new Date(task.approval.createdAt), 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>
                {task.approval.remarks && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{task.approval.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Information */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Task Information</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </div>
                <p className="text-base font-semibold text-gray-900">
                  {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                </p>
                {overdue && (
                  <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Overdue
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <User className="w-4 h-4" />
                  Assigned To
                </div>
                <p className="text-base font-semibold text-gray-900">{task.assignedTo.name}</p>
                <p className="text-xs text-gray-500">{task.assignedTo.email}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Building2 className="w-4 h-4" />
                  Firm
                </div>
                <Link
                  href={`/firms/${task.firm.id}`}
                  className="text-base font-semibold text-primary-600 hover:text-primary-700"
                >
                  {task.firm.name}
                </Link>
                <p className="text-xs text-gray-500">{task.firm.client.name}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <User className="w-4 h-4" />
                  Created By
                </div>
                <p className="text-base font-semibold text-gray-900">{task.createdBy.name}</p>
              </div>

              {task.completedAt && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    Completed On
                  </div>
                  <p className="text-base font-semibold text-gray-900">
                    {format(new Date(task.completedAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Clock className="w-4 h-4" />
                  Created On
                </div>
                <p className="text-base font-semibold text-gray-900">
                  {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

