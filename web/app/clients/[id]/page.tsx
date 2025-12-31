'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Building2, Mail, Phone, MapPin, FileText, Plus, X, Users, CheckCircle, Edit2, Trash2, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

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

type SortField = 'name' | 'panNumber' | 'status' | 'tasks';
type SortDirection = 'asc' | 'desc';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFirmForm, setShowFirmForm] = useState(false);
  const [editingFirm, setEditingFirm] = useState<Firm | null>(null);
  const [firmFormData, setFirmFormData] = useState({
    name: '',
    panNumber: '',
    gstNumber: '',
    registrationNumber: '',
    address: '',
  });
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
      toast.success('Firm created successfully!');
      setShowFirmForm(false);
      setFirmFormData({ name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
      loadClient();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create firm');
    }
  };

  const handleEditFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFirm) return;
    try {
      await api.put(`/firms/${editingFirm.id}`, firmFormData);
      toast.success('Firm updated successfully!');
      setEditingFirm(null);
      setFirmFormData({ name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
      loadClient();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update firm');
    }
  };

  const handleDeleteFirm = async (firmId: number, firmName: string) => {
    if (!confirm(`Are you sure you want to delete "${firmName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/firms/${firmId}`);
      toast.success('Firm deleted successfully!');
      loadClient();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete firm');
    }
  };

  const openEditForm = (firm: Firm) => {
    setEditingFirm(firm);
    setFirmFormData({
      name: firm.name,
      panNumber: firm.panNumber,
      gstNumber: firm.gstNumber || '',
      registrationNumber: '',
      address: '',
    });
    setShowFirmForm(false);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedFirms = () => {
    if (!client) return [];
    return [...client.firms].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'panNumber':
          comparison = a.panNumber.localeCompare(b.panNumber);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'tasks':
          comparison = a._count.tasks - b._count.tasks;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-4 h-4 text-gray-300" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-primary-600" />
      : <ChevronDown className="w-4 h-4 text-primary-600" />;
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

  const sortedFirms = getSortedFirms();

  return (
    <AppLayout title={`Client: ${client.name}`}>
      {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Clients
        </button>

        {/* Client Information Header - Full Width Horizontal Layout */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Client Name & Contact */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">{client.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                {client.contactPerson && (
                  <p className="text-gray-600">{client.contactPerson}</p>
                )}
              </div>
            </div>

            {/* Right: Contact Details - Horizontal */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${client.email}`} className="text-primary-600 hover:underline">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${client.phone}`} className="text-gray-700 hover:text-gray-900">
                    {client.phone}
                  </a>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{client.address}</span>
                </div>
              )}
              {/* Stats */}
              <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-lg">
                <Building2 className="w-4 h-4 text-primary-600" />
                <span className="text-primary-700 font-medium">{client.firms.length} Firms</span>
              </div>
            </div>
          </div>
          
          {/* Notes - if present */}
          {client.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-600">{client.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Firms Section - Table View */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Firms</h2>
                <p className="text-sm text-gray-500">{client.firms.length} {client.firms.length === 1 ? 'firm' : 'firms'} associated</p>
              </div>
            </div>
            {isCA && (
              <button
                onClick={() => {
                  setShowFirmForm(!showFirmForm);
                  setEditingFirm(null);
                  if (!showFirmForm) {
                    setFirmFormData({ name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
                  }
                }}
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

          {/* Add/Edit Firm Form */}
          {(showFirmForm || editingFirm) && isCA && (
            <form onSubmit={editingFirm ? handleEditFirm : handleCreateFirm} className="p-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingFirm ? 'Edit Firm' : 'Add New Firm'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    placeholder="Optional"
                  />
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={firmFormData.address}
                    onChange={(e) => setFirmFormData({ ...firmFormData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter firm address"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    {editingFirm ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFirmForm(false);
                      setEditingFirm(null);
                      setFirmFormData({ name: '', panNumber: '', gstNumber: '', registrationNumber: '', address: '' });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Firms Table */}
          {client.firms.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Firm Name
                        <SortIcon field="name" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('panNumber')}
                    >
                      <div className="flex items-center gap-2">
                        PAN Number
                        <SortIcon field="panNumber" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      GST Number
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('tasks')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Tasks
                        <SortIcon field="tasks" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Docs
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Invoices
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedFirms.map((firm) => (
                    <tr key={firm.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link 
                          href={`/firms/${firm.id}`}
                          className="text-primary-600 font-semibold hover:underline"
                        >
                          {firm.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-mono text-sm">
                        {firm.panNumber}
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-mono text-sm">
                        {firm.gstNumber || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          firm.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {firm.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          {firm._count.tasks}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                          {firm._count.documents}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                          {firm._count.invoices}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/firms/${firm.id}`}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {isCA && (
                            <>
                              <button
                                onClick={() => openEditForm(firm)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteFirm(firm.id, firm.name)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
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
    </AppLayout>
  );
}

