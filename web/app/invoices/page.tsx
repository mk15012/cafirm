'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  paidDate?: string;
  firm: {
    id: string;
    name: string;
    client: { id: string; name: string };
  };
  createdAt: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [firms, setFirms] = useState<Array<{ id: string; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: '', firmId: '' });
  const [formData, setFormData] = useState({
    firmId: '',
    amount: '',
    taxAmount: '',
    dueDate: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadInvoices();
    loadFirms();
  }, [isAuthenticated, router, filters]);

  const loadInvoices = async () => {
    try {
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
      setShowForm(false);
      setFormData({ firmId: '', amount: '', taxAmount: '', dueDate: '' });
      loadInvoices();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create invoice');
    }
  };

  const handlePay = async (id: string) => {
    if (!confirm('Mark this invoice as paid?')) return;
    try {
      await api.put(`/invoices/${id}/pay`, {});
      loadInvoices();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to mark as paid');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UNPAID: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      PARTIAL: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isAuthenticated || loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-700">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            + Create Invoice
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Firm</label>
              <select
                value={filters.firmId}
                onChange={(e) => setFilters({ ...filters, firmId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
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

        {showForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Create Invoice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Firm *</label>
                  <select
                    required
                    value={formData.firmId}
                    onChange={(e) => setFormData({ ...formData, firmId: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select Firm</option>
                    {firms.map((firm) => (
                      <option key={firm.id} value={firm.id}>
                        {firm.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Create Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/firms/${invoice.firm.id}`} className="text-primary-600 hover:underline">
                      {invoice.firm.name}
                    </Link>
                    <p className="text-xs text-gray-500">{invoice.firm.client.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{invoice.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    ₹{invoice.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {invoice.status !== 'PAID' && (
                      <button
                        onClick={() => handlePay(invoice.id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Mark Paid
                      </button>
                    )}
                    <Link href={`/invoices/${invoice.id}`} className="text-primary-600 hover:text-primary-900">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">No invoices found</div>
          )}
        </div>
      </main>
    </div>
  );
}

