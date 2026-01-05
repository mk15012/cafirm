'use client';

import { useState, useEffect } from 'react';
import { Check, X, Zap, Crown, Building2, Rocket, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyPricePaise: number;
  yearlyPricePaise: number;
  popular: boolean;
  limits: {
    clients: string | number;
    firmsPerClient: string | number;
    users: string | number;
    storage: string;
    credentials: string | number;
  };
  features: {
    taxCalculator: boolean;
    approvalWorkflow: boolean;
    activityLogs: boolean;
    documentManagement: boolean;
    invoiceManagement: boolean;
    meetings: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
  };
}

const featureLabels: Record<string, string> = {
  taxCalculator: 'Tax Regime Calculator',
  approvalWorkflow: 'Approval Workflow',
  activityLogs: 'Activity Logs',
  documentManagement: 'Document Management',
  invoiceManagement: 'Invoice Management',
  meetings: 'Meeting Scheduler',
  customBranding: 'Custom Invoice Branding',
  apiAccess: 'API Access',
  prioritySupport: 'Priority Support',
};

const planIcons: Record<string, React.ReactNode> = {
  FREE: <Zap className="w-6 h-6" />,
  BASIC: <Building2 className="w-6 h-6" />,
  PROFESSIONAL: <Crown className="w-6 h-6" />,
  ENTERPRISE: <Rocket className="w-6 h-6" />,
};

const planColors: Record<string, string> = {
  FREE: 'from-slate-500 to-slate-600',
  BASIC: 'from-blue-500 to-blue-600',
  PROFESSIONAL: 'from-purple-500 to-violet-600',
  ENTERPRISE: 'from-amber-500 to-orange-600',
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/plans`);
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
      // Use fallback data
      setPlans([
        {
          id: 'FREE',
          name: 'Starter',
          description: 'Perfect for trying out CA Firm Pro',
          monthlyPrice: '₹0',
          yearlyPrice: '₹0',
          monthlyPricePaise: 0,
          yearlyPricePaise: 0,
          popular: false,
          limits: { clients: 10, firmsPerClient: 10, users: 2, storage: '512 MB', credentials: 20 },
          features: { taxCalculator: true, approvalWorkflow: false, activityLogs: false, documentManagement: true, invoiceManagement: true, meetings: false, customBranding: false, apiAccess: false, prioritySupport: false },
        },
        {
          id: 'BASIC',
          name: 'Basic',
          description: 'For small CA practices',
          monthlyPrice: '₹499',
          yearlyPrice: '₹4,999',
          monthlyPricePaise: 49900,
          yearlyPricePaise: 499900,
          popular: false,
          limits: { clients: 50, firmsPerClient: 50, users: 5, storage: '5 GB', credentials: 100 },
          features: { taxCalculator: true, approvalWorkflow: true, activityLogs: false, documentManagement: true, invoiceManagement: true, meetings: true, customBranding: false, apiAccess: false, prioritySupport: false },
        },
        {
          id: 'PROFESSIONAL',
          name: 'Professional',
          description: 'For growing practices',
          monthlyPrice: '₹999',
          yearlyPrice: '₹9,999',
          monthlyPricePaise: 99900,
          yearlyPricePaise: 999900,
          popular: true,
          limits: { clients: 200, firmsPerClient: 200, users: 15, storage: '20 GB', credentials: 400 },
          features: { taxCalculator: true, approvalWorkflow: true, activityLogs: true, documentManagement: true, invoiceManagement: true, meetings: true, customBranding: true, apiAccess: false, prioritySupport: true },
        },
        {
          id: 'ENTERPRISE',
          name: 'Enterprise',
          description: 'For large CA firms',
          monthlyPrice: '₹2,499',
          yearlyPrice: '₹24,999',
          monthlyPricePaise: 249900,
          yearlyPricePaise: 2499900,
          popular: false,
          limits: { clients: 'Unlimited', firmsPerClient: 'Unlimited', users: 'Unlimited', storage: '50 GB', credentials: 'Unlimited' },
          features: { taxCalculator: true, approvalWorkflow: true, activityLogs: true, documentManagement: true, invoiceManagement: true, meetings: true, customBranding: true, apiAccess: true, prioritySupport: true },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (plan: Plan) => {
    return billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getSavings = (plan: Plan) => {
    if (plan.monthlyPricePaise === 0) return null;
    const monthlyTotal = plan.monthlyPricePaise * 12;
    const yearlySavings = monthlyTotal - plan.yearlyPricePaise;
    if (yearlySavings <= 0) return null;
    return `Save ₹${(yearlySavings / 100).toLocaleString('en-IN')}`;
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Start free and upgrade as your practice grows. All plans include a 14-day free trial.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-white rounded-full p-1.5 shadow-lg border border-slate-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yearly
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all hover:shadow-2xl hover:-translate-y-1 ${
                    plan.popular ? 'border-primary-500 ring-4 ring-primary-100' : 'border-slate-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Plan Header */}
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${planColors[plan.id]} text-white mb-4`}>
                      {planIcons[plan.id]}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-slate-500 text-sm mt-1 mb-4">{plan.description}</p>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-slate-900">{getPrice(plan)}</span>
                        {plan.monthlyPricePaise > 0 && (
                          <span className="text-slate-500">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                        )}
                      </div>
                      {billingCycle === 'yearly' && getSavings(plan) && (
                        <span className="inline-block mt-2 text-sm text-green-600 font-medium">
                          {getSavings(plan)} per year
                        </span>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Link
                      href={plan.id === 'FREE' ? '/auth/signup' : '/auth/signup'}
                      className={`block w-full py-3 px-4 rounded-xl font-semibold text-center transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:shadow-lg hover:shadow-primary-200'
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {plan.id === 'FREE' ? 'Start Free' : 'Start Trial'}
                      <ArrowRight className="inline-block w-4 h-4 ml-2" />
                    </Link>
                  </div>

                  {/* Limits */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Limits
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-slate-600">Clients</span>
                        <span className="font-semibold text-slate-900">{plan.limits.clients}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-slate-600">Firms/Client</span>
                        <span className="font-semibold text-slate-900">{plan.limits.firmsPerClient}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-slate-600">Team Members</span>
                        <span className="font-semibold text-slate-900">{plan.limits.users}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-slate-600">Storage</span>
                        <span className="font-semibold text-slate-900">{plan.limits.storage}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-slate-600">Credentials</span>
                        <span className="font-semibold text-slate-900">{plan.limits.credentials}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Features */}
                  <div className="px-6 py-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Features
                    </p>
                    <ul className="space-y-2">
                      {Object.entries(plan.features).map(([key, enabled]) => (
                        <li key={key} className="flex items-center gap-2 text-sm">
                          {enabled ? (
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          )}
                          <span className={enabled ? 'text-slate-700' : 'text-slate-400'}>
                            {featureLabels[key]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="bg-white border-t border-slate-200 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              Frequently Asked Questions
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Can I upgrade or downgrade anytime?</h3>
                <p className="text-slate-600 text-sm">
                  Yes! You can upgrade your plan anytime and the price difference will be prorated. Downgrades take effect at the end of your billing cycle.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-slate-600 text-sm">
                  We accept all major credit/debit cards, UPI, net banking, and wallets through Razorpay. GST invoice provided.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Is there a free trial?</h3>
                <p className="text-slate-600 text-sm">
                  Yes! All paid plans come with a 14-day free trial. No credit card required to start.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">What happens if I exceed my limits?</h3>
                <p className="text-slate-600 text-sm">
                  You'll receive a notification to upgrade. Your existing data remains safe, but you won't be able to add new items until you upgrade.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Do you offer discounts for CAs?</h3>
                <p className="text-slate-600 text-sm">
                  Yes! We offer special discounts for ICAI members and CA firms with multiple licenses. Contact us for bulk pricing.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Is my data secure?</h3>
                <p className="text-slate-600 text-sm">
                  Absolutely. We use AES-256 encryption for sensitive data, SSL for all connections, and regular backups. Your data is hosted on secure Indian servers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your CA Practice?
            </h2>
            <p className="text-primary-100 text-lg mb-8">
              Join 500+ CA firms already using CA Firm Pro. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-xl font-semibold hover:bg-primary-50 transition-colors shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/30 px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

