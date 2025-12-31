'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import { 
  Key, 
  Plus, 
  X, 
  Search, 
  Eye, 
  EyeOff, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check,
  ArrowLeft,
  Shield,
  Building2,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Credential {
  id: number;
  clientId: number;
  client: { id: number; name: string };
  firmId: number | null;
  firm: { id: number; name: string } | null;
  portalName: string;
  portalUrl: string | null;
  username: string;
  password: string;
  remarks: string | null;
  lastUpdated: string;
  createdAt: string;
}

interface Client {
  id: number;
  name: string;
}

interface Firm {
  id: number;
  name: string;
  client: { id: number; name: string };
}

const COMMON_PORTALS = [
  { name: 'Income Tax Portal', url: 'https://www.incometax.gov.in' },
  { name: 'GST Portal', url: 'https://www.gst.gov.in' },
  { name: 'MCA Portal', url: 'https://www.mca.gov.in' },
  { name: 'TDS Portal (TRACES)', url: 'https://www.tdscpc.gov.in' },
  { name: 'PF Portal (EPFO)', url: 'https://www.epfindia.gov.in' },
  { name: 'ESI Portal', url: 'https://www.esic.in' },
  { name: 'E-Way Bill', url: 'https://ewaybillgst.gov.in' },
  { name: 'Other', url: '' },
];

export default function CredentialsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('');
  const [selectedPortalFilter, setSelectedPortalFilter] = useState('All');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    firmId: '',
    portalName: '',
    portalUrl: '',
    username: '',
    password: '',
    remarks: '',
  });

  // Filter firms based on selected client
  const filteredFirms = useMemo(() => {
    if (!selectedClientId) return [];
    return firms.filter(firm => firm.client.id === selectedClientId);
  }, [firms, selectedClientId]);

  // Get unique portal types for tabs
  const portalTypes = useMemo(() => {
    const types = new Set(credentials.map(cred => cred.portalName));
    return ['All', ...Array.from(types).sort()];
  }, [credentials]);

  // Get portal counts for badges
  const portalCounts = useMemo(() => {
    const counts: Record<string, number> = { All: credentials.length };
    credentials.forEach(cred => {
      counts[cred.portalName] = (counts[cred.portalName] || 0) + 1;
    });
    return counts;
  }, [credentials]);

  // Filter credentials based on search, client filter, and portal filter
  const filteredCredentials = useMemo(() => {
    return credentials.filter(cred => {
      const matchesSearch = searchQuery === '' || 
        cred.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.firm?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.portalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesClient = selectedClientFilter === '' || 
        cred.clientId === parseInt(selectedClientFilter);

      const matchesPortal = selectedPortalFilter === 'All' || 
        cred.portalName === selectedPortalFilter;
      
      return matchesSearch && matchesClient && matchesPortal;
    });
  }, [credentials, searchQuery, selectedClientFilter, selectedPortalFilter]);

  // Group credentials by client
  const groupedCredentials = useMemo(() => {
    const grouped: Record<string, Credential[]> = {};
    filteredCredentials.forEach(cred => {
      const key = cred.client.name;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(cred);
    });
    return grouped;
  }, [filteredCredentials]);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      loadCredentials();
      loadClients();
      loadFirms();
    }
  }, [isAuthenticated, isLoading, router, user]);

  // Check if user can edit (CA only)
  const canEdit = user?.role === 'CA';

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/credentials');
      setCredentials(response.data);
    } catch (error) {
      console.error('Failed to load credentials:', error);
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

  const loadFirms = async () => {
    try {
      const response = await api.get('/firms');
      setFirms(response.data);
    } catch (error) {
      console.error('Failed to load firms:', error);
    }
  };

  const handleClientChange = (clientId: string) => {
    const id = clientId ? parseInt(clientId) : null;
    setSelectedClientId(id);
    setFormData({ ...formData, clientId, firmId: '' });
  };

  const handlePortalSelect = (portalName: string) => {
    const portal = COMMON_PORTALS.find(p => p.name === portalName);
    setFormData({ 
      ...formData, 
      portalName, 
      portalUrl: portal?.url || '' 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCredential) {
        await api.put(`/credentials/${editingCredential.id}`, {
          portalName: formData.portalName,
          portalUrl: formData.portalUrl || null,
          username: formData.username,
          password: formData.password || undefined, // Don't send if empty (keep existing)
          remarks: formData.remarks || null,
        });
        toast.success('Credential updated successfully!');
      } else {
        await api.post('/credentials', formData);
        toast.success('Credential added successfully!');
      }
      resetForm();
      loadCredentials();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save credential');
    }
  };

  const handleDelete = async (id: number, portalName: string) => {
    if (!confirm(`Delete credentials for "${portalName}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/credentials/${id}`);
      toast.success('Credential deleted!');
      loadCredentials();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete credential');
    }
  };

  const openEditForm = (cred: Credential) => {
    setEditingCredential(cred);
    setSelectedClientId(cred.clientId);
    setFormData({
      clientId: cred.clientId.toString(),
      firmId: cred.firmId?.toString() || '',
      portalName: cred.portalName,
      portalUrl: cred.portalUrl || '',
      username: cred.username,
      password: '', // Don't show existing password
      remarks: cred.remarks || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCredential(null);
    setSelectedClientId(null);
    setFormData({
      clientId: '',
      firmId: '',
      portalName: '',
      portalUrl: '',
      username: '',
      password: '',
      remarks: '',
    });
  };

  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  if (isLoading || loading) {
    return (
      <AppLayout title="Portal Credentials">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading credentials...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout title="Portal Credentials">
      {/* Header */}
      <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Portal Credentials</h1>
                <p className="text-sm text-gray-500">Securely store client login details for govt portals</p>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Credential
              </button>
            )}
          </div>
        </div>

        {/* Portal Type Tabs */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-6 overflow-hidden">
          <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
            {portalTypes.map((portal) => (
              <button
                key={portal}
                onClick={() => setSelectedPortalFilter(portal)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedPortalFilter === portal
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {portal === 'All' ? '📋' : 
                 portal.includes('Income Tax') ? '💰' :
                 portal.includes('GST') ? '📊' :
                 portal.includes('MCA') ? '🏢' :
                 portal.includes('TDS') || portal.includes('TRACES') ? '📑' :
                 portal.includes('PF') || portal.includes('EPFO') ? '👷' :
                 portal.includes('ESI') ? '🏥' :
                 portal.includes('E-Way') ? '🚚' : '🔐'}
                {portal}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  selectedPortalFilter === portal
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {portalCounts[portal] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Client Filter */}
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by client, firm, or username..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <select
                value={selectedClientFilter}
                onChange={(e) => setSelectedClientFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCredential ? 'Edit Credential' : 'Add New Credential'}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {!editingCredential && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Client *</span>
                      </label>
                      <select
                        required
                        value={formData.clientId}
                        onChange={(e) => handleClientChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select Client</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> Firm (Optional)</span>
                      </label>
                      <select
                        value={formData.firmId}
                        onChange={(e) => setFormData({ ...formData, firmId: e.target.value })}
                        disabled={!selectedClientId}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          !selectedClientId ? 'bg-gray-100' : ''
                        }`}
                      >
                        <option value="">All Firms / Client Level</option>
                        {filteredFirms.map(firm => (
                          <option key={firm.id} value={firm.id}>{firm.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Portal *</label>
                    <select
                      value={formData.portalName}
                      onChange={(e) => handlePortalSelect(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Select Portal</option>
                      {COMMON_PORTALS.map(portal => (
                        <option key={portal.name} value={portal.name}>{portal.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Portal URL</label>
                    <input
                      type="url"
                      value={formData.portalUrl}
                      onChange={(e) => setFormData({ ...formData, portalUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username / ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter username or PAN"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password * {editingCredential && <span className="text-gray-400">(leave blank to keep existing)</span>}
                    </label>
                    <input
                      type="password"
                      required={!editingCredential}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={2}
                    placeholder="Any additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    {editingCredential ? 'Update' : 'Save Credential'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Credentials List - Grouped by Client */}
        {Object.keys(groupedCredentials).length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
            <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Credentials Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {canEdit ? 'Start by adding portal credentials for your clients' : 'No portal credentials have been added yet'}
            </p>
            {canEdit && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Credential
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedCredentials).map(([clientName, clientCreds]) => (
              <div key={clientName} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    {clientName}
                    <span className="text-sm font-normal text-gray-500">({clientCreds.length} portals)</span>
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {clientCreds.map((cred) => (
                    <div key={cred.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{cred.portalName}</span>
                            {cred.firm && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {cred.firm.name}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 font-medium">User:</span>
                              <code className="font-mono text-gray-900 bg-slate-200 px-3 py-1 rounded-md border border-slate-300">{cred.username}</code>
                              <button
                                onClick={() => copyToClipboard(cred.username, cred.id * 1000)}
                                className="p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                                title="Copy username"
                              >
                                {copiedId === cred.id * 1000 ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 font-medium">Pass:</span>
                              <code className="font-mono text-gray-900 bg-slate-200 px-3 py-1 rounded-md border border-slate-300">
                                {visiblePasswords.has(cred.id) ? cred.password : '••••••••'}
                              </code>
                              <button
                                onClick={() => togglePasswordVisibility(cred.id)}
                                className="p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                                title={visiblePasswords.has(cred.id) ? 'Hide password' : 'Show password'}
                              >
                                {visiblePasswords.has(cred.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => copyToClipboard(cred.password, cred.id)}
                                className="p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                                title="Copy password"
                              >
                                {copiedId === cred.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          {cred.remarks && (
                            <p className="text-xs text-gray-500 mt-1">{cred.remarks}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {cred.portalUrl && (
                            <a
                              href={cred.portalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Open Portal"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {canEdit && (
                            <>
                              <button
                                onClick={() => openEditForm(cred)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cred.id, cred.portalName)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </AppLayout>
  );
}

