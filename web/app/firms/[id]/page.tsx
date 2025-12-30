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
  CreditCard
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

export default function FirmDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();
  const [firm, setFirm] = useState<Firm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
      AWAITING_APPROVAL: 'bg-purple-100 text-purple-800 border-purple-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      ERROR: 'bg-red-100 text-red-800 border-red-200',
      OVERDUE: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getInvoiceStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UNPAID: 'bg-red-100 text-red-800 border-red-200',
      PAID: 'bg-green-100 text-green-800 border-green-200',
      OVERDUE: 'bg-orange-100 text-orange-800 border-orange-200',
      PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Firms
        </button>

        {/* Firm Information Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{firm.name}</h1>
              <Link 
                href={`/clients/${firm.client.id}`}
                className="text-lg text-primary-600 hover:text-primary-700 hover:underline mt-1 inline-flex items-center gap-1"
              >
                <Users className="w-4 h-4" />
                {firm.client.name}
              </Link>
            </div>
            <span className={`px-4 py-2 text-sm font-semibold rounded-full border ${getStatusColor(firm.status)}`}>
              {firm.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">PAN Number</p>
                <p className="text-gray-900 font-semibold">{firm.panNumber}</p>
              </div>
            </div>
            {firm.gstNumber && (
              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">GST Number</p>
                  <p className="text-gray-900 font-semibold">{firm.gstNumber}</p>
                </div>
              </div>
            )}
            {firm.registrationNumber && (
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Registration Number</p>
                  <p className="text-gray-900 font-semibold">{firm.registrationNumber}</p>
                </div>
              </div>
            )}
            {firm.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-gray-900">{firm.address}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Created On</p>
                <p className="text-gray-900">{format(new Date(firm.createdAt), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link
            href={`/tasks?firmId=${firm.id}`}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{firm._count.tasks}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-primary-600" />
            </div>
          </Link>
          <Link
            href={`/documents?firmId=${firm.id}`}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Documents</p>
                <p className="text-2xl font-bold text-gray-900">{firm._count.documents}</p>
              </div>
              <FileText className="w-8 h-8 text-primary-600" />
            </div>
          </Link>
          <Link
            href={`/invoices?firmId=${firm.id}`}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{firm._count.invoices}</p>
              </div>
              <Receipt className="w-8 h-8 text-primary-600" />
            </div>
          </Link>
        </div>

        {/* Recent Tasks */}
        {firm.tasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Tasks</h2>
              <Link
                href={`/tasks?firmId=${firm.id}`}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {firm.tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                      <p className="text-sm text-gray-600">Assigned to: {task.assignedTo.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getTaskStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">{task.priority}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Documents */}
        {firm.documents.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Documents</h2>
              <Link
                href={`/documents?firmId=${firm.id}`}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {firm.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.fileName}</p>
                      <p className="text-sm text-gray-500">{doc.documentType}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Invoices */}
        {firm.invoices.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Invoices</h2>
              <Link
                href={`/invoices?firmId=${firm.id}`}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {firm.invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        ₹{invoice.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getInvoiceStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty States */}
        {firm.tasks.length === 0 && firm.documents.length === 0 && firm.invoices.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
            <p className="text-sm text-gray-500 mb-4">This firm doesn't have any tasks, documents, or invoices yet.</p>
            <div className="flex gap-2 justify-center">
              <Link
                href={`/tasks?firmId=${firm.id}`}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                Create Task
              </Link>
              <Link
                href={`/documents?firmId=${firm.id}`}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Upload Document
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

