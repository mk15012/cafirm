'use client';

import { X, Crown, Zap, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: string; // e.g., "clients", "users", "credentials"
  currentUsage: number;
  limit: number;
  currentPlan: string;
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  resource, 
  currentUsage, 
  limit, 
  currentPlan 
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const resourceLabels: Record<string, string> = {
    clients: 'Clients',
    users: 'Team Members',
    credentials: 'Stored Credentials',
    firms: 'Firms',
    storage: 'Storage',
  };

  const nextPlan = currentPlan === 'FREE' ? 'Basic' : currentPlan === 'BASIC' ? 'Professional' : 'Enterprise';
  const nextPlanLimits: Record<string, Record<string, number | string>> = {
    Basic: { clients: 15, users: 3, credentials: 25 },
    Professional: { clients: 50, users: 10, credentials: 100 },
    Enterprise: { clients: 'Unlimited', users: 'Unlimited', credentials: 'Unlimited' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-6 py-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Upgrade Required
            </h2>
            <p className="text-white/90">
              You've reached your plan limit
            </p>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current usage */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-800">
                  {resourceLabels[resource] || resource} Limit Reached
                </p>
                <p className="text-sm text-red-600">
                  You're using {currentUsage} of {limit} {resourceLabels[resource]?.toLowerCase() || resource}
                </p>
              </div>
            </div>
          </div>

          {/* Upgrade benefits */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500 mb-3">
              Upgrade to {nextPlan} to get:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-slate-700">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>
                  {nextPlanLimits[nextPlan]?.[resource] || 'More'} {resourceLabels[resource]?.toLowerCase() || resource}
                </span>
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Approval workflows</span>
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link
              href="/settings/subscription"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all"
            >
              View Plans & Upgrade
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              onClick={onClose}
              className="w-full py-3 text-slate-600 font-medium hover:text-slate-900 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Current plan badge */}
          <div className="mt-4 text-center">
            <span className="text-xs text-slate-400">
              Current plan: <span className="font-medium text-slate-600">{currentPlan}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

