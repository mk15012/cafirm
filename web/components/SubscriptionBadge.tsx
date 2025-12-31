'use client';

import { useState, useEffect } from 'react';
import { Crown, Zap, Building2, Rocket, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface SubscriptionData {
  subscription: {
    plan: string;
    planName: string;
    status: string;
  };
  usage: {
    clients: { used: number; limit: number };
    users: { used: number; limit: number };
  };
}

const planIcons: Record<string, React.ReactNode> = {
  FREE: <Zap className="w-4 h-4" />,
  BASIC: <Building2 className="w-4 h-4" />,
  PROFESSIONAL: <Crown className="w-4 h-4" />,
  ENTERPRISE: <Rocket className="w-4 h-4" />,
};

const planColors: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-700',
  BASIC: 'bg-blue-100 text-blue-700',
  PROFESSIONAL: 'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700',
};

export default function SubscriptionBadge({ compact = false }: { compact?: boolean }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await api.get('/subscription/my');
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !subscription) {
    return null;
  }

  const { plan, planName } = subscription.subscription;
  const isFreePlan = plan === 'FREE';

  if (compact) {
    return (
      <Link href="/settings/subscription" className="block">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${planColors[plan]} transition-colors hover:opacity-80`}>
          {planIcons[plan]}
          <span className="text-sm font-semibold">{planName}</span>
          {isFreePlan && (
            <span className="ml-auto text-xs bg-white/50 px-2 py-0.5 rounded-full">
              Upgrade
            </span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className={`rounded-xl p-4 ${isFreePlan ? 'bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200' : `bg-gradient-to-br ${planColors[plan].replace('bg-', 'from-').replace('text-', '')} border-0`}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${planColors[plan]}`}>
          {planIcons[plan]}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{planName} Plan</p>
          <p className="text-xs text-slate-500">
            {isFreePlan ? 'Limited features' : 'Active subscription'}
          </p>
        </div>
      </div>

      {/* Usage bars */}
      <div className="space-y-2 mb-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600">Clients</span>
            <span className="font-medium">
              {subscription.usage.clients.used}/{subscription.usage.clients.limit === -1 ? '∞' : subscription.usage.clients.limit}
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${subscription.usage.clients.used >= subscription.usage.clients.limit && subscription.usage.clients.limit !== -1 ? 'bg-red-500' : 'bg-primary-500'}`}
              style={{ 
                width: subscription.usage.clients.limit === -1 
                  ? '10%' 
                  : `${Math.min(100, (subscription.usage.clients.used / subscription.usage.clients.limit) * 100)}%` 
              }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600">Team Members</span>
            <span className="font-medium">
              {subscription.usage.users.used}/{subscription.usage.users.limit === -1 ? '∞' : subscription.usage.users.limit}
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${subscription.usage.users.used >= subscription.usage.users.limit && subscription.usage.users.limit !== -1 ? 'bg-red-500' : 'bg-primary-500'}`}
              style={{ 
                width: subscription.usage.users.limit === -1 
                  ? '10%' 
                  : `${Math.min(100, (subscription.usage.users.used / subscription.usage.users.limit) * 100)}%` 
              }}
            />
          </div>
        </div>
      </div>

      {isFreePlan ? (
        <Link 
          href="/settings/subscription" 
          className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          Upgrade Plan
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <Link 
          href="/settings/subscription" 
          className="flex items-center justify-center gap-1 w-full py-2 text-slate-600 text-sm font-medium hover:text-slate-900 transition-colors"
        >
          Manage Subscription
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

