'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { Receipt, Plus, X, Filter, DollarSign, Calendar, Building2, CheckCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Invoice {
  id: number;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  paidDate?: string;
  firm: {
    id: number;
    name: string;
    client: { id: number; name: string };
  };
  createdAt: string;
}

interface Firm {
  id: number;
  name: string;
  client: { id: number; name: string };
}

interface Client {
  id: number;
  name: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [filters, setFilters] = useState({ status: '', firmId: '' });
  const [selectedClientId, setSelectedClientId] = useState('');
  const [formData, setFormData] = useState({
    firmId: '',
    amount: '',
    taxAmount: '',
    dueDate: '',
  });

  // Filter firms based on selected client
  const filteredFirms = useMemo(() => {
    if (!selectedClientId) return [];
    return firms.filter(firm => firm.client.id === parseInt(selectedClientId));
  }, [firms, selectedClientId]);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      loadInvoices();
      loadFirms();
      loadClients();
    }
  }, [isAuthenticated, isLoading, router, filters]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.firmId) params.append('firmId', filters.firmId);
      const response = await api.get(`/invoices?${params.toString()}`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFirms = async () => {
    try {
      const response = await api.get('/firms');
      setFirms(response.data);
    } catch (error) {
      console.error('Failed to load firms:', error);
    }
  };

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    // Reset firm selection when client changes
    setFormData({ ...formData, firmId: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(formData.amount);
      const taxAmount = parseFloat(formData.taxAmount) || 0;
      await api.post('/invoices', {
        ...formData,
        amount,
        taxAmount,
      });
      toast.success('Invoice created successfully!');
      setShowForm(false);
      setSelectedClientId('');
      setFormData({ firmId: '', amount: '', taxAmount: '', dueDate: '' });
      loadInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create invoice');
    }
  };

  const handlePayRequest = (invoice: Invoice) => {
    setPayingInvoice(invoice);
  };

  const handlePayConfirm = async () => {
    if (!payingInvoice) return;
    try {
      await api.put(`/invoices/${payingInvoice.id}/pay`, {});
      toast.success('Invoice marked as paid!');
      setPayingInvoice(null);
      loadInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to mark as paid');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UNPAID: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PAID: 'bg-green-100 text-green-800 border-green-200',
      OVERDUE: 'bg-red-100 text-red-800 border-red-200',
      PARTIAL: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const hasActiveFilters = filters.status || filters.firmId;
  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date() && filters.status !== 'PAID';

  if (isLoading || loading) {
    return (
      <AppLayout title="Invoices">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading invoices...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + inv.totalAmount, 0);
  const unpaidAmount = invoices.filter(i => i.status !== 'PAID').reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <AppLayout title="Invoices">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-sm text-gray-500">Manage billing and payments</p>
          </div>
        </div>
        <div className="flex gap-2">
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
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Unpaid Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{unpaidAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {(showFilters || hasActiveFilters) && (
        <div className="mb-6 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Invoices</h3>
            <button
              onClick={() => {
                setShowFilters(false);
                setFilters({ status: '', firmId: '' });
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Firm</label>
              <select
                value={filters.firmId}
                onChange={(e) => setFilters({ ...filters, firmId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Firms</option>
                {firms.map((firm) => (
                  <option key={firm.id} value={firm.id}>
                    {firm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create Invoice</h2>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedClientId('');
                setFormData({ firmId: '', amount: '', taxAmount: '', dueDate: '' });
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Client Selection - First */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Client *
                  </span>
                </label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Client First</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Firm Selection - Filtered by Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    Firm *
                  </span>
                </label>
                <select
                  required
                  value={formData.firmId}
                  onChange={(e) => setFormData({ ...formData, firmId: e.target.value })}
                  disabled={!selectedClientId}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    !selectedClientId ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">
                    {!selectedClientId 
                      ? 'Select a client first' 
                      : filteredFirms.length === 0 
                        ? 'No firms for this client' 
                        : 'Select Firm'}
                  </option>
                  {filteredFirms.map((firm) => (
                    <option key={firm.id} value={firm.id}>
                      {firm.name}
                    </option>
                  ))}
                </select>
                {selectedClientId && filteredFirms.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    This client has no firms. Please add a firm first.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.taxAmount}
                  onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                  style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#111827' }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Create Invoice
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedClientId('');
                  setFormData({ firmId: '', amount: '', taxAmount: '', dueDate: '' });
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
            <p className="text-sm text-gray-500 mb-4">Get started by creating your first invoice</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Firm</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => {
                  const overdue = isOverdue(invoice.dueDate);
                  return (
                    <tr
                      key={invoice.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        overdue ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <div>
                            <Link
                              href={`/firms/${invoice.firm.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-primary-600"
                            >
                              {invoice.firm.name}
                            </Link>
                            <p className="text-xs text-gray-500">{invoice.firm.client.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">₹{invoice.amount.toLocaleString('en-IN')}</span>
                        {invoice.taxAmount > 0 && (
                          <p className="text-xs text-gray-500">+ ₹{invoice.taxAmount.toLocaleString('en-IN')} tax</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          {invoice.status !== 'PAID' && (
                            <button
                              onClick={() => handlePayRequest(invoice)}
                              className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark Paid
                            </button>
                          )}
                          <Link href={`/invoices/${invoice.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark as Paid Confirmation Modal */}
      <ConfirmModal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        onConfirm={handlePayConfirm}
        title="Mark Invoice as Paid?"
        message={`Are you sure you want to mark invoice #${payingInvoice?.invoiceNumber} (₹${payingInvoice?.totalAmount?.toLocaleString('en-IN')}) as paid?`}
        confirmText="Yes, Mark as Paid"
        cancelText="Cancel"
        variant="success"
      />
    </AppLayout>
  );
}
