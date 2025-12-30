'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Building2, Mail, Phone, MapPin, FileText, Plus, X, Users, CheckCircle } from 'lucide-react';

interface Firm {
  id: number;
  name: string;
  panNumber: string;
  gstNumber?: string;
  status: string;
  _count: {
    tasks: number;
    documents: number;
    invoices: number;
  };
}

interface Client {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  firms: Firm[];
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFirmForm, setShowFirmForm] = useState(false);
  const [firmFormData, setFirmFormData] = useState({
    name: '',
    panNumber: '',
    gstNumber: '',
    registrationNumber: '',
    address: '',
  });

  const isCA = user?.role === 'CA';

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      loadClient();
    }
  }, [params.id, isAuthenticated, isLoading, router]);

  const loadClient = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/clients/${params.id}`);
      setClient(response.data);
    } catch (error: any) {
      console.error('Failed to load client:', error);
      setError(error.response?.data?.error || 'Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/firms', {
        ...firmFormData,
        clientId: params.id,
      });
      setShowFirmForm(false);
      setFirmFormData({ name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
      loadClient();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create firm');
    }
  };

  if (isLoading || loading) {
    return (
      <AppLayout title="Client Details">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading client details...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !client) {
    return (
      <AppLayout title="Client Details">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Client</h1>
            <p className="text-gray-600 mb-4">{error || 'Client not found'}</p>
            <button
              onClick={loadClient}
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
    <AppLayout title={`Client: ${client.name}`}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Clients
        </button>

        {/* Client Information Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
              {client.contactPerson && (
                <p className="text-lg text-gray-600 mt-1">{client.contactPerson}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <a href={`mailto:${client.email}`} className="text-primary-600 hover:underline">
                    {client.email}
                  </a>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <a href={`tel:${client.phone}`} className="text-gray-900">
                    {client.phone}
                  </a>
                </div>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-gray-900">{client.address}</p>
                </div>
              </div>
            )}
            {client.notes && (
              <div className="flex items-start gap-3 md:col-span-2">
                <FileText className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-gray-900">{client.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Firms Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Firms</h2>
                <p className="text-sm text-gray-500">{client.firms.length} {client.firms.length === 1 ? 'Firm' : 'Firms'}</p>
              </div>
            </div>
            {isCA && (
              <button
                onClick={() => setShowFirmForm(!showFirmForm)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {showFirmForm ? (
                  <>
                    <X className="w-4 h-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Firm
                  </>
                )}
              </button>
            )}
          </div>

          {/* Add Firm Form */}
          {showFirmForm && isCA && (
            <form onSubmit={handleCreateFirm} className="mb-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Firm</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Firm Name *</label>
                  <input
                    type="text"
                    required
                    value={firmFormData.name}
                    onChange={(e) => setFirmFormData({ ...firmFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter firm name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number *</label>
                  <input
                    type="text"
                    required
                    value={firmFormData.panNumber}
                    onChange={(e) => setFirmFormData({ ...firmFormData, panNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                  <input
                    type="text"
                    value={firmFormData.gstNumber}
                    onChange={(e) => setFirmFormData({ ...firmFormData, gstNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="27ABCDE1234F1Z5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                  <input
                    type="text"
                    value={firmFormData.registrationNumber}
                    onChange={(e) => setFirmFormData({ ...firmFormData, registrationNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="U12345MH2020PTC123456"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={firmFormData.address}
                    onChange={(e) => setFirmFormData({ ...firmFormData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Enter firm address"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Create Firm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFirmForm(false);
                    setFirmFormData({ name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Firms List */}
          {client.firms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.firms.map((firm) => (
                <Link
                  key={firm.id}
                  href={`/firms/${firm.id}`}
                  className="bg-gray-50 hover:bg-gray-100 rounded-xl p-6 border border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-primary-600 hover:underline mb-2">
                        {firm.name}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">PAN:</span> {firm.panNumber}</p>
                        {firm.gstNumber && (
                          <p><span className="font-medium">GST:</span> {firm.gstNumber}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      firm.status === 'Active' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {firm.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{firm._count.tasks} Tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{firm._count.documents} Docs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{firm._count.invoices} Invoices</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Firms Found</h3>
              <p className="text-sm text-gray-500 mb-4">Get started by adding your first firm for this client</p>
              {isCA && (
                <button
                  onClick={() => setShowFirmForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Firm
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

