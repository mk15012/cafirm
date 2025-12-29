'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { Building2, Plus, X, CheckSquare, FileText, Receipt, Users } from 'lucide-react';

interface Firm {
  id: string;
  name: string;
  panNumber: string;
  gstNumber?: string;
  status: string;
  client: { id: string; name: string };
  _count: {
    tasks: number;
    documents: number;
    invoices: number;
  };
}

export default function FirmsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    panNumber: '',
    gstNumber: '',
    registrationNumber: '',
    address: '',
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
      loadFirms();
      loadClients();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadFirms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/firms');
      setFirms(response.data);
    } catch (error) {
      console.error('Failed to load firms:', error);
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/firms', formData);
      setShowForm(false);
      setFormData({ clientId: '', name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
      loadFirms();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create firm');
    }
  };

  if (isLoading || loading) {
    return (
      <AppLayout title="Firms">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading firms...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout title="Firms">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Firms</h1>
            <p className="text-sm text-gray-500">Manage client firms and entities</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Firm
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Add New Firm</h2>
            <button
              onClick={() => {
                setShowForm(false);
                setFormData({ clientId: '', name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Firm Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Firm name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number *</label>
                <input
                  type="text"
                  required
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="29ABCDE1234F1Z5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Registration number"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Firm address"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Create Firm
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ clientId: '', name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Firms Grid */}
      {firms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No firms found</h3>
          <p className="text-sm text-gray-500 mb-4">Get started by adding your first firm</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Firm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {firms.map((firm) => (
            <div
              key={firm.id}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link href={`/firms/${firm.id}`}>
                    <h3 className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors mb-1">
                      {firm.name}
                    </h3>
                  </Link>
                  <Link href={`/clients/${firm.client.id}`}>
                    <p className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                      <Users className="w-4 h-4 inline mr-1" />
                      {firm.client.name}
                    </p>
                  </Link>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  firm.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {firm.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">PAN:</span>
                  <span className="text-gray-900 ml-2">{firm.panNumber}</span>
                </div>
                {firm.gstNumber && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">GST:</span>
                    <span className="text-gray-900 ml-2">{firm.gstNumber}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <CheckSquare className="w-4 h-4 text-primary-600" />
                  <span className="font-medium">{firm._count.tasks}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <FileText className="w-4 h-4 text-primary-600" />
                  <span className="font-medium">{firm._count.documents}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Receipt className="w-4 h-4 text-primary-600" />
                  <span className="font-medium">{firm._count.invoices}</span>
                </div>
              </div>

              <Link
                href={`/firms/${firm.id}`}
                className="mt-4 block text-sm text-primary-600 hover:text-primary-700 font-medium text-center"
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
