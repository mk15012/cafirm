'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Package, AlertCircle, IndianRupee, RefreshCw, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Service {
  id: number;
  name: string;
  description: string | null;
  category: string;
  frequency: string;
  rate: number;
  isActive: boolean;
}

const categories = [
  { value: 'ITR', label: 'Income Tax (ITR)', color: 'bg-blue-100 text-blue-700' },
  { value: 'GST', label: 'GST', color: 'bg-green-100 text-green-700' },
  { value: 'TDS', label: 'TDS', color: 'bg-purple-100 text-purple-700' },
  { value: 'AUDIT', label: 'Audit', color: 'bg-amber-100 text-amber-700' },
  { value: 'ROC', label: 'ROC', color: 'bg-red-100 text-red-700' },
  { value: 'REGISTRATION', label: 'Registration', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'CONSULTATION', label: 'Consultation', color: 'bg-pink-100 text-pink-700' },
  { value: 'OTHER', label: 'Other', color: 'bg-slate-100 text-slate-700' },
];

const frequencies = [
  { value: 'ONE_TIME', label: 'One-time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const getCategoryColor = (category: string) => {
  return categories.find(c => c.value === category)?.color || 'bg-slate-100 text-slate-700';
};

const getCategoryLabel = (category: string) => {
  return categories.find(c => c.value === category)?.label || category;
};

const getFrequencyLabel = (frequency: string) => {
  return frequencies.find(f => f.value === frequency)?.label || frequency;
};

export default function ServicesSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'ITR',
    frequency: 'ONE_TIME',
    rate: '',
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      // Convert rate from paise to rupees
      const servicesWithRupees = response.data.map((s: Service) => ({
        ...s,
        rate: s.rate / 100,
      }));
      setServices(servicesWithRupees);
    } catch (error) {
      console.error('Failed to load services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedRequest = () => {
    if (services.length > 0) {
      setShowSeedConfirm(true);
    } else {
      handleSeedDefaults();
    }
  };

  const handleSeedDefaults = async () => {
    setShowSeedConfirm(false);
    setSeeding(true);
    try {
      const response = await api.post('/services/seed-defaults');
      toast.success(response.data.message);
      loadServices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to seed default services');
    } finally {
      setSeeding(false);
    }
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category: 'ITR',
      frequency: 'ONE_TIME',
      rate: '',
    });
    setShowModal(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category,
      frequency: service.frequency,
      rate: service.rate.toString(),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Service name is required');
      return;
    }
    
    if (!formData.rate || parseFloat(formData.rate) < 0) {
      toast.error('Valid rate is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        frequency: formData.frequency,
        rate: parseFloat(formData.rate),
      };

      if (editingService) {
        await api.put(`/services/${editingService.id}`, payload);
        toast.success('Service updated successfully');
      } else {
        await api.post('/services', payload);
        toast.success('Service created successfully');
      }
      
      setShowModal(false);
      loadServices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = (service: Service) => {
    setDeletingService(service);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingService) return;
    try {
      await api.delete(`/services/${deletingService.id}`);
      toast.success('Service deleted successfully');
      setDeletingService(null);
      loadServices();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete service');
    }
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <AppLayout title="Services & Pricing">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AppLayout>
    );
  }

  // Check CA access only after auth is confirmed
  if (user?.role !== 'CA') {
    return (
      <AppLayout title="Services & Pricing">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-amber-800 mb-2">CA Access Required</h2>
          <p className="text-amber-700">Only the CA owner can manage service pricing.</p>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout title="Services & Pricing">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Services & Pricing">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Your Services</h2>
            <p className="text-gray-600">
              Configure your service offerings and pricing. These will be used when adding clients.
            </p>
          </div>
          <div className="flex gap-3">
            {services.length === 0 && (
              <button
                onClick={handleSeedRequest}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                {seeding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Load Defaults
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>
          </div>
        </div>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Yet</h3>
          <p className="text-gray-600 mb-6">
            Add your service offerings to speed up client onboarding and invoice generation.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleSeedRequest}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Load Default Services
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Custom Service
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)}`}>
                    {getCategoryLabel(category)}
                  </span>
                  <span className="text-sm text-gray-500">{categoryServices.length} services</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {categoryServices.map((service) => (
                  <div
                    key={service.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-gray-900">{service.name}</h4>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {getFrequencyLabel(service.frequency)}
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-500">{service.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                          <IndianRupee className="w-4 h-4" />
                          {service.rate.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(service)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(service)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ITR - Salaried Individual"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the service"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {frequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate (₹) *
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="1500"
                    min="0"
                    step="1"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter amount in rupees</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 How Services Work</h3>
        <ul className="text-blue-800 space-y-2 text-sm">
          <li>• <strong>When adding a client</strong>, you can select a service to automatically create a task and invoice</li>
          <li>• <strong>Frequency</strong> indicates how often this service recurs (One-time, Monthly, Quarterly, Yearly)</li>
          <li>• <strong>Recurring services</strong> can auto-generate tasks and invoices based on your compliance calendar</li>
          <li>• You can always override the rate for specific clients if needed</li>
        </ul>
      </div>

      {/* Delete Service Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingService}
        onClose={() => setDeletingService(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Service?"
        message={`Are you sure you want to delete "${deletingService?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Seed Defaults Confirmation Modal */}
      <ConfirmModal
        isOpen={showSeedConfirm}
        onClose={() => setShowSeedConfirm(false)}
        onConfirm={handleSeedDefaults}
        title="Load Default Services?"
        message="This will add default services to your list. Existing services will not be affected."
        confirmText="Yes, Load Defaults"
        cancelText="Cancel"
        variant="info"
      />
    </AppLayout>
  );
}

