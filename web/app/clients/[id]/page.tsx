'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';

interface Firm {
  id: string;
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
  id: string;
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
  const { isAuthenticated } = useAuthStore();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFirmForm, setShowFirmForm] = useState(false);
  const [firmFormData, setFirmFormData] = useState({
    name: '',
    panNumber: '',
    gstNumber: '',
    registrationNumber: '',
    address: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadClient();
  }, [params.id, isAuthenticated, router]);

  const loadClient = async () => {
    try {
      const response = await api.get(`/clients/${params.id}`);
      setClient(response.data);
    } catch (error) {
      console.error('Failed to load client:', error);
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

  if (!isAuthenticated || loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!client) {
    return <div className="p-8">Client not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/clients" className="text-primary-600 hover:text-primary-700">
            ← Back to Clients
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">{client.name}</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Contact Person</p>
              <p className="font-medium">{client.contactPerson || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{client.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{client.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{client.address || '-'}</p>
            </div>
            {client.notes && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Notes</p>
                <p className="font-medium">{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Firms</h2>
            <button
              onClick={() => setShowFirmForm(!showFirmForm)}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              + Add Firm
            </button>
          </div>

          {showFirmForm && (
            <form onSubmit={handleCreateFirm} className="mb-6 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={firmFormData.name}
                    onChange={(e) => setFirmFormData({ ...firmFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">PAN Number *</label>
                  <input
                    type="text"
                    required
                    value={firmFormData.panNumber}
                    onChange={(e) => setFirmFormData({ ...firmFormData, panNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GST Number</label>
                  <input
                    type="text"
                    value={firmFormData.gstNumber}
                    onChange={(e) => setFirmFormData({ ...firmFormData, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={firmFormData.registrationNumber}
                    onChange={(e) => setFirmFormData({ ...firmFormData, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    value={firmFormData.address}
                    onChange={(e) => setFirmFormData({ ...firmFormData, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Create Firm
                </button>
                <button
                  type="button"
                  onClick={() => setShowFirmForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {client.firms.map((firm) => (
              <div key={firm.id} className="border rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/firms/${firm.id}`} className="text-lg font-semibold text-primary-600 hover:underline">
                      {firm.name}
                    </Link>
                    <p className="text-sm text-gray-600">PAN: {firm.panNumber}</p>
                    {firm.gstNumber && <p className="text-sm text-gray-600">GST: {firm.gstNumber}</p>}
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded ${firm.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {firm.status}
                    </span>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Tasks: {firm._count.tasks}</p>
                      <p>Documents: {firm._count.documents}</p>
                      <p>Invoices: {firm._count.invoices}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {client.firms.length === 0 && (
              <div className="text-center py-8 text-gray-500">No firms found</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

