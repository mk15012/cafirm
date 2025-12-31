'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  FileText, 
  Receipt, 
  CheckSquare, 
  Calendar,
  AlertCircle,
  MapPin,
  Hash,
  CreditCard,
  Eye,
  ExternalLink,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo: {
    id: number;
    name: string;
  };
}

interface Document {
  id: number;
  fileName: string;
  documentType: string;
  createdAt: string;
}

interface Invoice {
  id: number;
  amount: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

interface Firm {
  id: number;
  name: string;
  panNumber: string;
  gstNumber?: string;
  registrationNumber?: string;
  address?: string;
  status: string;
  createdAt: string;
  client: {
    id: number;
    name: string;
  };
  tasks: Task[];
  documents: Document[];
  invoices: Invoice[];
  _count: {
    tasks: number;
    documents: number;
    invoices: number;
  };
}

type ActiveTab = 'tasks' | 'documents' | 'invoices';

export default function FirmDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();
  const [firm, setFirm] = useState<Firm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      loadFirm();
    }
  }, [params.id, isAuthenticated, isLoading, router]);

  const loadFirm = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/firms/${params.id}`);
      setFirm(response.data);
    } catch (error: any) {
      console.error('Failed to load firm:', error);
      setError(error.response?.data?.error || 'Failed to load firm');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTaskStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      AWAITING_APPROVAL: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      ERROR: 'bg-red-100 text-red-800',
      OVERDUE: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      HIGH: 'text-red-600',
      MEDIUM: 'text-amber-600',
      LOW: 'text-green-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  const getInvoiceStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UNPAID: 'bg-red-100 text-red-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-orange-100 text-orange-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading || loading) {
    return (
      <AppLayout title="Firm Details">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading firm details...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !firm) {
    return (
      <AppLayout title="Firm Details">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Firm</h1>
            <p className="text-gray-600 mb-4">{error || 'Firm not found'}</p>
            <button
              onClick={loadFirm}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Firm: ${firm.name}`}>
      {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Firms
        </button>

        {/* Firm Header - Full Width Horizontal Layout */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Firm Name & Client */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{firm.name}</h1>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(firm.status)}`}>
                    {firm.status}
                  </span>
                </div>
                <Link 
                  href={`/clients/${firm.client.id}`}
                  className="text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1 text-sm mt-1"
                >
                  <Users className="w-4 h-4" />
                  {firm.client.name}
                </Link>
              </div>
            </div>

            {/* Right: Key Details - Horizontal */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-gray-500">PAN:</span>
                  <span className="ml-1 font-mono font-medium text-gray-900">{firm.panNumber}</span>
                </div>
              </div>
              {firm.gstNumber && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">GST:</span>
                    <span className="ml-1 font-mono font-medium text-gray-900">{firm.gstNumber}</span>
                  </div>
                </div>
              )}
              {firm.registrationNumber && (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Reg:</span>
                    <span className="ml-1 font-mono font-medium text-gray-900">{firm.registrationNumber}</span>
                  </div>
                </div>
              )}
              {firm.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{firm.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">Created {format(new Date(firm.createdAt), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'tasks' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span className="font-medium">{firm._count.tasks} Tasks</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'documents' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">{firm._count.documents} Documents</span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'invoices' 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Receipt className="w-5 h-5" />
              <span className="font-medium">{firm._count.invoices} Invoices</span>
            </button>
            
            <div className="ml-auto">
              <Link
                href={`/firms/${firm.id}/compliance`}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-sm"
              >
                <Calendar className="w-4 h-4" />
                Compliance Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Content - Table Views */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
                <Link
                  href={`/tasks?firmId=${firm.id}`}
                  className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  View All <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
              {firm.tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Task</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned To</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {firm.tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900">{task.title}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{task.assignedTo.name}</td>
                          <td className="px-6 py-4 text-gray-600">{format(new Date(task.dueDate), 'MMM dd, yyyy')}</td>
                          <td className="px-6 py-4">
                            <span className={`font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTaskStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link
                              href={`/tasks/${task.id}`}
                              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-flex"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No tasks yet</p>
                  <Link
                    href={`/tasks?firmId=${firm.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    Create Task
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Documents</h2>
                <Link
                  href={`/documents?firmId=${firm.id}`}
                  className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  View All <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
              {firm.documents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">File Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Uploaded On</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {firm.documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-primary-600" />
                              <span className="font-medium text-gray-900">{doc.fileName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                              {doc.documentType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{format(new Date(doc.createdAt), 'MMM dd, yyyy')}</td>
                          <td className="px-6 py-4 text-center">
                            <Link
                              href={`/documents?firmId=${firm.id}`}
                              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-flex"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No documents yet</p>
                  <Link
                    href={`/documents?firmId=${firm.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    Upload Document
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
                <Link
                  href={`/invoices?firmId=${firm.id}`}
                  className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  View All <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
              {firm.invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created On</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {firm.invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900">₹{invoice.totalAmount.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</td>
                          <td className="px-6 py-4 text-gray-600">{format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInvoiceStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-flex"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No invoices yet</p>
                  <Link
                    href={`/invoices?firmId=${firm.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    Create Invoice
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
    </AppLayout>
  );
}

