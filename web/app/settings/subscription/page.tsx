'use client';

import { useState, useEffect } from 'react';
import { Check, Crown, Zap, Building2, Rocket, ArrowRight, AlertCircle, CreditCard, Calendar } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

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
  features: Record<string, boolean>;
}

interface SubscriptionData {
  subscription: {
    plan: string;
    planName: string;
    status: string;
    billingCycle: string;
    startDate: string;
    endDate: string | null;
  };
  usage: {
    clients: { used: number; limit: number };
    firms: { used: number; limit: number };
    users: { used: number; limit: number };
    storageMB: { used: number; limit: number };
    credentials: { used: number; limit: number };
  };
  features: Record<string, boolean>;
}

const planIcons: Record<string, React.ReactNode> = {
  FREE: <Zap className="w-5 h-5" />,
  BASIC: <Building2 className="w-5 h-5" />,
  PROFESSIONAL: <Crown className="w-5 h-5" />,
  ENTERPRISE: <Rocket className="w-5 h-5" />,
};

const planColors: Record<string, string> = {
  FREE: 'from-slate-500 to-slate-600',
  BASIC: 'from-blue-500 to-blue-600',
  PROFESSIONAL: 'from-purple-500 to-violet-600',
  ENTERPRISE: 'from-amber-500 to-orange-600',
};

export default function SubscriptionSettingsPage() {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        api.get('/subscription/my'),
        api.get('/subscription/plans'),
      ]);
      setSubscription(subRes.data);
      setPlans(plansRes.data);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === subscription?.subscription.plan) {
      toast.error('You are already on this plan');
      return;
    }

    // Free plan - direct upgrade
    if (planId === 'FREE') {
      setUpgrading(true);
      setSelectedPlan(planId);
      try {
        const response = await api.post('/subscription/upgrade', {
          plan: planId,
          billingCycle,
        });
        toast.success(response.data.message);
        loadData();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to change plan');
      } finally {
        setUpgrading(false);
        setSelectedPlan(null);
      }
      return;
    }

    // Paid plan - use Razorpay
    setUpgrading(true);
    setSelectedPlan(planId);
    
    try {
      // Create order
      const orderRes = await api.post('/payment/create-order', {
        planCode: planId,
        billingCycle,
      });

      const { orderId, amount, currency, keyId, planName } = orderRes.data;

      // Load Razorpay script if not already loaded
      if (!(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // Open Razorpay checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'CA Firm Pro',
        description: `${planName} Plan - ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyRes = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            toast.success('Payment successful! Your plan has been upgraded.');
            loadData();
          } catch (error: any) {
            toast.error(error.response?.data?.error || 'Payment verification failed');
          } finally {
            setUpgrading(false);
            setSelectedPlan(null);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#7c3aed',
        },
        modal: {
          ondismiss: function() {
            setUpgrading(false);
            setSelectedPlan(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to initiate payment');
      setUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 10;
    return Math.min(100, (used / limit) * 100);
  };

  const getUsageColor = (used: number, limit: number) => {
    if (limit === -1) return 'bg-primary-500';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-primary-500';
  };

  if (user?.role !== 'CA') {
    return (
      <AppLayout title="Subscription">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-amber-800 mb-2">CA Access Required</h2>
          <p className="text-amber-700">Only the CA owner can manage subscription settings.</p>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout title="Subscription">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Subscription Settings">
      {/* Current Plan */}
      {subscription && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Current Plan</h2>
              <p className="text-gray-600">Manage your subscription and usage</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${planColors[subscription.subscription.plan]} text-white`}>
              {planIcons[subscription.subscription.plan]}
              <span className="font-semibold">{subscription.subscription.planName}</span>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Clients', ...subscription.usage.clients },
              { label: 'Firms', ...subscription.usage.firms },
              { label: 'Team Members', ...subscription.usage.users },
              { label: 'Storage (MB)', ...subscription.usage.storageMB },
              { label: 'Credentials', ...subscription.usage.credentials },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-semibold">
                    {item.used}/{item.limit === -1 ? '∞' : item.limit}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${getUsageColor(item.used, item.limit)}`}
                    style={{ width: `${getUsagePercentage(item.used, item.limit)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Billing Info */}
          <div className="flex flex-wrap gap-6 text-sm text-gray-600 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Billing: {subscription.subscription.billingCycle}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Started: {new Date(subscription.subscription.startDate).toLocaleDateString()}</span>
            </div>
            {subscription.subscription.endDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Renews: {new Date(subscription.subscription.endDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-8">
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

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === subscription?.subscription.plan;
          const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all ${
                isCurrent
                  ? 'border-primary-500 ring-4 ring-primary-100'
                  : plan.popular
                  ? 'border-purple-300'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                    Current Plan
                  </span>
                </div>
              )}
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${planColors[plan.id]} text-white mb-4`}>
                  {planIcons[plan.id]}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-500 text-sm mt-1 mb-4">{plan.description}</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{price}</span>
                  {plan.monthlyPricePaise > 0 && (
                    <span className="text-gray-500 text-sm">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  )}
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || upgrading}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:shadow-lg'
                  }`}
                >
                  {upgrading && selectedPlan === plan.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : isCurrent ? (
                    <>
                      <Check className="w-4 h-4" />
                      Current
                    </>
                  ) : plan.monthlyPricePaise === 0 ? (
                    'Downgrade'
                  ) : (
                    <>
                      Upgrade
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Plan Limits */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-sm">
                <ul className="space-y-1.5">
                  <li className="flex justify-between">
                    <span className="text-gray-600">Clients</span>
                    <span className="font-medium text-gray-900">{plan.limits.clients}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Users</span>
                    <span className="font-medium text-gray-900">{plan.limits.users}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Storage</span>
                    <span className="font-medium text-gray-900">{plan.limits.storage}</span>
                  </li>
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Section */}
      <div className="mt-12 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
        <p className="text-gray-600 mb-4">
          Contact our sales team for custom enterprise solutions or bulk discounts.
        </p>
        <a
          href="mailto:sales@cafirmpro.com"
          className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
        >
          sales@cafirmpro.com
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </AppLayout>
  );
}

