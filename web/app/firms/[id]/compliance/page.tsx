'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Building2, Calculator, CheckCircle, AlertCircle, Save, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface ComplianceSuggestion {
  code: string;
  name: string;
  category: string;
  applicable: boolean;
  reason: string;
  frequency?: string;
  dueDate?: string;
  canOverride: boolean;
}

interface EntityType {
  code: string;
  name: string;
  itrType: string;
  hasROC?: boolean;
}

interface State {
  name: string;
  isSpecialCategory: boolean;
}

interface Firm {
  id: number;
  name: string;
  client: { id: number; name: string };
  entityType: string | null;
  natureOfBusiness: string | null;
  state: string | null;
  annualTurnover: string | null;
  financialYear: string | null;
  hasGST: boolean;
  gstFrequency: string | null;
  hasTDS: boolean;
  hasITR: boolean;
  itrType: string | null;
  itrDueDate: string | null;
  hasTaxAudit: boolean;
  hasAdvanceTax: boolean;
  hasROC: boolean;
  complianceNotes: string | null;
}

export default function FirmCompliancePage() {
  const router = useRouter();
  const params = useParams();
  const firmId = params?.id as string;
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firm, setFirm] = useState<Firm | null>(null);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [suggestions, setSuggestions] = useState<ComplianceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [formData, setFormData] = useState({
    entityType: '',
    natureOfBusiness: '',
    state: '',
    annualTurnover: '',
    financialYear: '2024-25',
    hasGST: false,
    gstFrequency: 'QUARTERLY',
    hasTDS: false,
    hasITR: true,
    itrType: '',
    itrDueDate: 'JULY_31',
    hasTaxAudit: false,
    hasAdvanceTax: false,
    hasROC: false,
    complianceNotes: '',
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
      loadData();
    }
  }, [isAuthenticated, isLoading, router, firmId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [firmRes, entityTypesRes, statesRes] = await Promise.all([
        api.get(`/firms/${firmId}`),
        api.get('/compliance/entity-types'),
        api.get('/compliance/states'),
      ]);
      
      setFirm(firmRes.data);
      setEntityTypes(entityTypesRes.data);
      setStates(statesRes.data);
      
      // Pre-fill form with existing data
      const f = firmRes.data;
      setFormData({
        entityType: f.entityType || '',
        natureOfBusiness: f.natureOfBusiness || '',
        state: f.state || '',
        annualTurnover: f.annualTurnover ? String(f.annualTurnover) : '',
        financialYear: f.financialYear || '2024-25',
        hasGST: f.hasGST || false,
        gstFrequency: f.gstFrequency || 'QUARTERLY',
        hasTDS: f.hasTDS || false,
        hasITR: f.hasITR !== false,
        itrType: f.itrType || '',
        itrDueDate: f.itrDueDate || 'JULY_31',
        hasTaxAudit: f.hasTaxAudit || false,
        hasAdvanceTax: f.hasAdvanceTax || false,
        hasROC: f.hasROC || false,
        complianceNotes: f.complianceNotes || '',
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load firm details');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async () => {
    if (!formData.entityType || !formData.natureOfBusiness || !formData.annualTurnover) {
      toast.error('Please fill entity type, nature of business, and annual turnover first');
      return;
    }
    
    try {
      const response = await api.post('/compliance/suggest', {
        entityType: formData.entityType,
        natureOfBusiness: formData.natureOfBusiness,
        state: formData.state || 'Maharashtra',
        annualTurnover: formData.annualTurnover,
      });
      
      setSuggestions(response.data);
      setShowSuggestions(true);
      
      // Auto-apply suggestions
      const sugg = response.data as ComplianceSuggestion[];
      const gstSugg = sugg.find(s => s.code === 'GST');
      const auditSugg = sugg.find(s => s.code === 'TAX_AUDIT');
      const itrSugg = sugg.find(s => s.code === 'ITR');
      const tdsSugg = sugg.find(s => s.code === 'TDS');
      const advTaxSugg = sugg.find(s => s.code === 'ADVANCE_TAX');
      const rocSugg = sugg.find(s => s.code === 'ROC');
      
      const entityInfo = entityTypes.find(e => e.code === formData.entityType);
      
      setFormData(prev => ({
        ...prev,
        hasGST: gstSugg?.applicable || false,
        gstFrequency: gstSugg?.frequency || 'QUARTERLY',
        hasTaxAudit: auditSugg?.applicable || false,
        hasITR: true,
        itrType: entityInfo?.itrType || '',
        itrDueDate: auditSugg?.applicable ? 'OCT_31' : 'JULY_31',
        hasTDS: tdsSugg?.applicable || false,
        hasAdvanceTax: advTaxSugg?.applicable || false,
        hasROC: rocSugg?.applicable || false,
      }));
      
      toast.success('Suggestions applied! Review and save.');
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      toast.error('Failed to get suggestions');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/compliance/firms/${firmId}`, formData);
      toast.success('Compliance settings saved!');
      router.push(`/firms/${firmId}`);
    } catch (error: any) {
      console.error('Failed to save:', error);
      toast.error(error.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/,/g, ''));
    if (isNaN(num)) return value;
    return num.toLocaleString('en-IN');
  };

  if (isLoading || loading) {
    return (
      <AppLayout title="Compliance Settings">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!firm) {
    return (
      <AppLayout title="Compliance Settings">
        <div className="text-center py-12">
          <p className="text-gray-500">Firm not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Compliance Settings - ${firm.name}`}>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Firm
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Settings</h1>
            <p className="text-sm text-gray-500">{firm.client.name} → {firm.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Details */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type *</label>
                <select
                  value={formData.entityType}
                  onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Entity Type</option>
                  {entityTypes.map(et => (
                    <option key={et.code} value={et.code}>{et.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nature of Business *</label>
                <select
                  value={formData.natureOfBusiness}
                  onChange={(e) => setFormData({ ...formData, natureOfBusiness: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Nature</option>
                  <option value="GOODS">Trading (Goods)</option>
                  <option value="SERVICES">Services</option>
                  <option value="BOTH">Both Goods & Services</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select State</option>
                  {states.map(s => (
                    <option key={s.name} value={s.name}>
                      {s.name} {s.isSpecialCategory ? '(Special Category)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Financial Year</label>
                <select
                  value={formData.financialYear}
                  onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2023-24">2023-24</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Turnover (₹) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="text"
                    value={formData.annualTurnover}
                    onChange={(e) => setFormData({ ...formData, annualTurnover: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="e.g., 8500000"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                {formData.annualTurnover && (
                  <p className="mt-1 text-sm text-gray-500">
                    ₹{formatCurrency(formData.annualTurnover)} ({(parseFloat(formData.annualTurnover) / 100000).toFixed(2)} Lakhs)
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={getSuggestions}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium"
              >
                <Sparkles className="w-4 h-4" />
                Get Compliance Suggestions
              </button>
            </div>
          </div>

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                System Suggestions
              </h2>
              <div className="space-y-3">
                {suggestions.map((sugg, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      sugg.applicable 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {sugg.applicable ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{sugg.name}</p>
                          <p className="text-sm text-gray-600 mt-1">{sugg.reason}</p>
                          {sugg.dueDate && (
                            <p className="text-xs text-gray-500 mt-1">Due: {sugg.dueDate}</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        sugg.applicable 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {sugg.applicable ? 'Applicable' : 'Not Required'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-600">
                ✅ Suggestions have been applied to the form below. Review and modify if needed.
              </p>
            </div>
          )}

          {/* Compliance Flags */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicable Compliances</h2>
            
            <div className="space-y-4">
              {/* GST */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasGST"
                    checked={formData.hasGST}
                    onChange={(e) => setFormData({ ...formData, hasGST: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="hasGST" className="font-medium text-gray-900">GST Registration & Filing</label>
                </div>
                {formData.hasGST && (
                  <select
                    value={formData.gstFrequency}
                    onChange={(e) => setFormData({ ...formData, gstFrequency: e.target.value })}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly (QRMP)</option>
                  </select>
                )}
              </div>
              
              {/* TDS */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="hasTDS"
                  checked={formData.hasTDS}
                  onChange={(e) => setFormData({ ...formData, hasTDS: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="hasTDS" className="ml-3 font-medium text-gray-900">TDS Returns (24Q, 26Q)</label>
              </div>
              
              {/* Tax Audit */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="hasTaxAudit"
                  checked={formData.hasTaxAudit}
                  onChange={(e) => setFormData({ ...formData, hasTaxAudit: e.target.checked, itrDueDate: e.target.checked ? 'OCT_31' : 'JULY_31' })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="hasTaxAudit" className="ml-3 font-medium text-gray-900">Tax Audit (Section 44AB)</label>
              </div>
              
              {/* ITR */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasITR"
                    checked={formData.hasITR}
                    onChange={(e) => setFormData({ ...formData, hasITR: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="hasITR" className="font-medium text-gray-900">Income Tax Return</label>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={formData.itrType}
                    onChange={(e) => setFormData({ ...formData, itrType: e.target.value })}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select ITR</option>
                    <option value="ITR1">ITR-1</option>
                    <option value="ITR2">ITR-2</option>
                    <option value="ITR3">ITR-3</option>
                    <option value="ITR4">ITR-4</option>
                    <option value="ITR5">ITR-5</option>
                    <option value="ITR6">ITR-6</option>
                    <option value="ITR7">ITR-7</option>
                  </select>
                  <span className="text-sm text-gray-500">
                    Due: {formData.itrDueDate === 'OCT_31' ? 'Oct 31' : 'July 31'}
                  </span>
                </div>
              </div>
              
              {/* Advance Tax */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="hasAdvanceTax"
                  checked={formData.hasAdvanceTax}
                  onChange={(e) => setFormData({ ...formData, hasAdvanceTax: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="hasAdvanceTax" className="ml-3 font-medium text-gray-900">Advance Tax (Quarterly)</label>
              </div>
              
              {/* ROC */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="hasROC"
                  checked={formData.hasROC}
                  onChange={(e) => setFormData({ ...formData, hasROC: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="hasROC" className="ml-3 font-medium text-gray-900">ROC Annual Filing (Companies/LLP only)</label>
              </div>
            </div>
            
            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                value={formData.complianceNotes}
                onChange={(e) => setFormData({ ...formData, complianceNotes: e.target.value })}
                rows={3}
                placeholder="Any special compliance requirements or notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Compliance Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reference</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700">GST Thresholds</h4>
                <ul className="mt-1 text-gray-500 space-y-1">
                  <li>• Goods: ₹40 Lakhs</li>
                  <li>• Services: ₹20 Lakhs</li>
                  <li>• Special States: ₹10 Lakhs</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">GST Filing</h4>
                <ul className="mt-1 text-gray-500 space-y-1">
                  <li>• Monthly if turnover {'>'}  ₹5 Cr</li>
                  <li>• Quarterly (QRMP) if ≤ ₹5 Cr</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Tax Audit (44AB)</h4>
                <ul className="mt-1 text-gray-500 space-y-1">
                  <li>• Business: {'>'} ₹1 Crore</li>
                  <li>• Profession: {'>'} ₹50 Lakhs</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">ITR Due Dates</h4>
                <ul className="mt-1 text-gray-500 space-y-1">
                  <li>• Non-audit: July 31</li>
                  <li>• Audit cases: October 31</li>
                  <li>• Transfer Pricing: November 30</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

