'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

const plans = [
  {
    key: 'FREE',
    name: 'Free',
    price: 0,
    description: 'Get started with basic features',
    features: ['5 posts per month', '1 social account', 'Basic scheduling', 'Community support'],
    limits: ['No AI generation', 'No API access'],
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: 29,
    popular: true,
    description: 'For creators and small businesses',
    features: ['100 posts per month', '5 social accounts', 'AI content generation', 'Advanced scheduling', 'API access', 'Priority support'],
    limits: [],
  },
  {
    key: 'AGENCY',
    name: 'Agency',
    price: 99,
    description: 'For teams and agencies',
    features: ['Unlimited posts', 'Unlimited accounts', 'Full AI suite', 'API access', 'Team management', 'Dedicated support', 'Custom integrations'],
    limits: [],
  },
];

const PLAN_ORDER: Record<string, number> = { FREE: 0, PRO: 1, AGENCY: 2 };

const typeLabels: Record<string, string> = {
  SUBSCRIPTION: 'New Subscription',
  UPGRADE: 'Upgrade',
  DOWNGRADE: 'Downgrade',
  RENEWAL: 'Renewal',
  REFUND: 'Refund',
};

const statusColors: Record<string, string> = {
  SUCCEEDED: 'text-emerald-400',
  PENDING: 'text-amber-400',
  FAILED: 'text-red-400',
  REFUNDED: 'text-purple-400',
};

export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const [cancelLoading, setCancelLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [discountOffer, setDiscountOffer] = useState<{ discountPercentage: number; message: string } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [billing, setBilling] = useState<any>(null);
  const [payments, setPayments] = useState<any>({ payments: [], total: 0 });
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState<string | null>(null);
  const [prorationPreview, setProrationPreview] = useState<any>(null);
  const [previewPlan, setPreviewPlan] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Handle Stripe redirect params
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    if (success === 'true') {
      setToast({ type: 'success', message: 'Payment successful! Your plan has been upgraded.' });
      refreshUser();
      window.history.replaceState({}, '', '/dashboard/billing');
    } else if (canceled === 'true') {
      setToast({ type: 'info', message: 'Checkout was canceled. No changes were made.' });
      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, [searchParams]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    api.get<any>('/subscriptions/billing').then(setBilling).catch(() => {});
  }, [user?.plan]);

  const fetchPayments = useCallback(() => {
    api.get<any>(`/subscriptions/payments?page=${paymentsPage}&limit=10`)
      .then(setPayments)
      .catch(() => {});
  }, [paymentsPage]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // Fetch proration preview when user hovers/clicks a plan
  const fetchPreview = async (planKey: string) => {
    if (planKey === user?.plan || previewPlan === planKey) return;
    setPreviewPlan(planKey);
    setPreviewLoading(true);
    try {
      const data = await api.get<any>(`/subscriptions/preview?plan=${planKey}`);
      setProrationPreview(data);
    } catch {
      setProrationPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewPlan(null);
    setProrationPreview(null);
  };

  const handleUpgrade = async (plan: string) => {
    setUpgradeLoading(plan);
    try {
      const data = await api.post<any>('/subscriptions/create', { plan });
      if (data.action === 'UPGRADED') {
        setToast({ type: 'success', message: data.message });
        closePreview();
        await refreshUser();
        fetchPayments();
        api.get<any>('/subscriptions/billing').then(setBilling).catch(() => {});
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to create checkout session' });
    } finally {
      setUpgradeLoading(null);
    }
  };

  const handleDowngrade = async (plan: string) => {
    setUpgradeLoading(plan);
    try {
      const data = await api.post<any>('/subscriptions/downgrade', { plan });
      if (data.action === 'DOWNGRADED' || data.action === 'UPGRADED') {
        setToast({ type: 'info', message: data.message });
        closePreview();
        setShowDowngradeConfirm(null);
        await refreshUser();
        fetchPayments();
        api.get<any>('/subscriptions/billing').then(setBilling).catch(() => {});
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to change plan' });
    } finally {
      setUpgradeLoading(null);
      setShowDowngradeConfirm(null);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const data = await api.post<any>('/subscriptions/cancel');
      if (data.action === 'DISCOUNT_OFFER') {
        setShowCancelConfirm(false);
        setDiscountOffer({ discountPercentage: data.discountPercentage, message: data.message });
      } else {
        setToast({ type: 'info', message: data.message });
        setShowCancelConfirm(false);
        await refreshUser();
        fetchPayments();
        api.get<any>('/subscriptions/billing').then(setBilling).catch(() => {});
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to cancel subscription' });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleAcceptDiscount = async () => {
    try {
      const data = await api.post<any>('/subscriptions/apply-discount');
      setToast({ type: 'success', message: data.message });
      setDiscountOffer(null);
      await refreshUser();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to apply discount' });
    }
  };

  const currentPlan = plans.find((p) => p.key === user?.plan) || plans[0];

  const toastColors = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  };

  // Billing cycle progress
  const cycleProgress = billing?.billingCycle
    ? Math.round(((billing.billingCycle.daysRemaining > 0 ? (30 - billing.billingCycle.daysRemaining) : 30) / 30) * 100)
    : 0;

  return (
    <div className="max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className={`border rounded-xl px-5 py-3.5 mb-6 flex items-center justify-between ${toastColors[toast.type]}`}>
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            {toast.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            {toast.type === 'info' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            <span className="text-sm">{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="hover:opacity-70 transition-opacity">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
        <p className="text-sm text-dark-300 mt-1">Manage your plan, payment cycle, and billing history</p>
      </div>

      {/* Discount Offer Modal */}
      {discountOffer && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-400 text-lg mb-1">Wait! We have a special offer</h3>
              <p className="text-dark-200 text-sm mb-4">{discountOffer.message}</p>
              <div className="flex gap-3">
                <button onClick={handleAcceptDiscount} className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity">
                  Accept {discountOffer.discountPercentage}% Off
                </button>
                <button onClick={() => { setDiscountOffer(null); setShowCancelConfirm(true); }} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl text-sm transition-colors">
                  No thanks, cancel anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation */}
      {showCancelConfirm && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-400 mb-1">Cancel Subscription?</h3>
              <p className="text-dark-200 text-sm mb-1">Your {currentPlan.name} plan will remain active until the end of your billing period.</p>
              <p className="text-dark-400 text-xs mb-4">After that, you&apos;ll lose access to: {currentPlan.features.slice(0, 3).join(', ')} and more.</p>
              <div className="flex gap-3">
                <button onClick={handleCancel} disabled={cancelLoading} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50">
                  {cancelLoading ? 'Canceling...' : 'Yes, Cancel Subscription'}
                </button>
                <button onClick={() => setShowCancelConfirm(false)} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl text-sm transition-colors">
                  Keep My Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan + Billing Cycle */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Current Plan Card */}
        <div className="lg:col-span-2 bg-dark-800 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-1">Current Plan</p>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-white">{currentPlan.name}</h2>
                {currentPlan.price > 0 ? (
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-extrabold text-primary-400">${currentPlan.price}</span>
                    <span className="text-sm text-dark-400">/mo</span>
                  </div>
                ) : (
                  <span className="text-sm text-dark-400">Free forever</span>
                )}
              </div>
              <p className="text-sm text-dark-300 mt-1">{currentPlan.description}</p>
            </div>
            {user?.plan !== 'FREE' && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={cancelLoading}
                className="text-sm text-dark-400 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                Cancel subscription
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {currentPlan.features.map((f) => (
              <span key={f} className="text-xs text-dark-200 bg-dark-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Billing Cycle Card */}
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-6">
          <p className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-3">Billing Cycle</p>
          {billing?.billingCycle ? (
            <div className="space-y-3">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-[10px] text-dark-400 mb-1.5">
                  <span>{new Date(billing.billingCycle.currentPeriodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>{new Date(billing.billingCycle.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all"
                    style={{ width: `${cycleProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark-400">Days Left</p>
                  <p className="text-2xl font-extrabold text-primary-400">{billing.billingCycle.daysRemaining}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-dark-400">Next Payment</p>
                  <p className="text-lg font-bold text-white">${currentPlan.price}</p>
                </div>
              </div>

              {billing.billingCycle.cancelAtPeriodEnd && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-red-400 font-medium">Cancels at period end</p>
                </div>
              )}

              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-dark-400">Total Paid</p>
                  <p className="text-sm text-white font-bold">${(billing?.stats?.totalPaid || 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-dark-400">Payments</p>
                  <p className="text-xs text-dark-300">{billing?.stats?.totalPayments || 0}</p>
                </div>
                {(billing?.stats?.totalRefunded || 0) > 0 && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-dark-400">Refunded</p>
                    <p className="text-xs text-red-400">${(billing?.stats?.totalRefunded || 0).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-dark-400">No active billing cycle</p>
              <div className="bg-dark-700 rounded-xl p-3 text-center">
                <p className="text-xs text-dark-400">Upgrade to start your subscription</p>
              </div>
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-dark-400">Total Paid</p>
                  <p className="text-sm text-white font-bold">${(billing?.stats?.totalPaid || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Proration Preview Modal */}
      {previewPlan && prorationPreview && (
        <div className="bg-gradient-to-r from-primary-500/5 to-accent-500/5 border border-primary-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                prorationPreview.isUpgrade ? 'bg-emerald-500/15' : 'bg-amber-500/15'
              }`}>
                {prorationPreview.isUpgrade ? (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                ) : (
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                )}
              </div>
              <div>
                <h3 className="font-bold text-white">
                  {prorationPreview.isUpgrade ? 'Upgrade' : 'Downgrade'} to {prorationPreview.targetPlan}
                </h3>
                <p className="text-xs text-dark-300">${prorationPreview.currentPrice}/mo → ${prorationPreview.targetPrice}/mo</p>
              </div>
            </div>
            <button onClick={closePreview} className="text-dark-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Proration Details */}
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            {prorationPreview.isUpgrade && (
              <div className="bg-dark-800/50 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-dark-400 uppercase tracking-wider">Due Today</p>
                <p className="text-xl font-extrabold text-emerald-400">${prorationPreview.proration.proratedCharge.toFixed(2)}</p>
                <p className="text-[10px] text-dark-400">Prorated for {prorationPreview.proration.daysRemaining} days</p>
              </div>
            )}
            {prorationPreview.proration.credit > 0 && (
              <div className="bg-dark-800/50 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-dark-400 uppercase tracking-wider">Credit</p>
                <p className="text-xl font-extrabold text-blue-400">${prorationPreview.proration.credit.toFixed(2)}</p>
                <p className="text-[10px] text-dark-400">Applied to next cycle</p>
              </div>
            )}
            <div className="bg-dark-800/50 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] text-dark-400 uppercase tracking-wider">Next Billing</p>
              <p className="text-xl font-extrabold text-white">${prorationPreview.billing.nextBillingAmount}/mo</p>
              <p className="text-[10px] text-dark-400">
                {prorationPreview.billing.nextBillingDate
                  ? new Date(prorationPreview.billing.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Starting next cycle'}
              </p>
            </div>
            <div className="bg-dark-800/50 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] text-dark-400 uppercase tracking-wider">Effective</p>
              <p className="text-sm font-bold text-white mt-1">
                {prorationPreview.isUpgrade ? 'Immediately' : new Date(prorationPreview.billing.effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-[10px] text-dark-400">{prorationPreview.isUpgrade ? 'Instant access' : 'End of current period'}</p>
            </div>
          </div>

          {/* Calculation breakdown */}
          {prorationPreview.isUpgrade && prorationPreview.proration.proratedCharge > 0 && (
            <div className="bg-dark-800/30 rounded-xl p-3 mb-4 text-xs text-dark-300">
              <p className="font-medium text-dark-200 mb-1">How it&apos;s calculated:</p>
              <p>${prorationPreview.targetPrice} - ${prorationPreview.currentPrice} = ${(prorationPreview.targetPrice - prorationPreview.currentPrice).toFixed(2)} difference/mo</p>
              <p>${(prorationPreview.targetPrice - prorationPreview.currentPrice).toFixed(2)} ÷ {prorationPreview.proration.daysInPeriod} days × {prorationPreview.proration.daysRemaining} remaining = <span className="text-white font-bold">${prorationPreview.proration.proratedCharge.toFixed(2)}</span></p>
            </div>
          )}

          <p className="text-sm text-dark-200 mb-4">{prorationPreview.summary}</p>

          <div className="flex gap-3">
            {prorationPreview.isUpgrade ? (
              <button
                onClick={() => handleUpgrade(previewPlan)}
                disabled={upgradeLoading === previewPlan}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {upgradeLoading === previewPlan ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>Confirm Upgrade — ${prorationPreview.proration.proratedCharge > 0 ? prorationPreview.proration.proratedCharge.toFixed(2) + ' today' : 'Free'}</>
                )}
              </button>
            ) : (
              <button
                onClick={() => handleDowngrade(previewPlan)}
                disabled={upgradeLoading === previewPlan}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {upgradeLoading === previewPlan ? 'Processing...' : 'Confirm Downgrade'}
              </button>
            )}
            <button onClick={closePreview} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Plan Comparison */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Change Plan</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = user?.plan === plan.key;
            const isUpgrade = PLAN_ORDER[plan.key] > PLAN_ORDER[user?.plan || 'FREE'];
            const isDowngrade = PLAN_ORDER[plan.key] < PLAN_ORDER[user?.plan || 'FREE'];
            const isPreviewTarget = previewPlan === plan.key;

            return (
              <div
                key={plan.key}
                className={`bg-dark-800 border rounded-2xl p-6 relative transition-all ${
                  isPreviewTarget
                    ? 'border-primary-500/50 ring-2 ring-primary-500/30 scale-[1.02]'
                    : isCurrent
                      ? 'border-primary-500/50 ring-1 ring-primary-500/20'
                      : plan.popular
                        ? 'border-white/10 hover:border-primary-500/30'
                        : 'border-white/5 hover:border-white/10'
                }`}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary-500 to-accent-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="mt-1">
                  <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-white">${plan.price}</span>
                    <span className="text-sm text-dark-400">/mo</span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">{plan.description}</p>

                  {/* Savings vs current plan */}
                  {isUpgrade && currentPlan.price > 0 && (
                    <p className="text-[10px] text-emerald-400 mt-1">
                      +${plan.price - currentPlan.price}/mo more
                    </p>
                  )}
                  {isDowngrade && plan.price > 0 && (
                    <p className="text-[10px] text-amber-400 mt-1">
                      Save ${currentPlan.price - plan.price}/mo
                    </p>
                  )}
                </div>

                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-dark-200 flex items-start gap-2">
                      <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                  {plan.limits.map((l) => (
                    <li key={l} className="text-sm text-dark-400 flex items-start gap-2">
                      <svg className="w-4 h-4 text-dark-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {l}
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {isCurrent ? (
                    <div className="w-full py-2.5 text-center text-sm text-primary-400 font-medium bg-primary-500/10 rounded-xl">
                      Your current plan
                    </div>
                  ) : isUpgrade ? (
                    <button
                      onClick={() => fetchPreview(plan.key)}
                      disabled={previewLoading && previewPlan === plan.key}
                      className={`w-full py-2.5 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:opacity-90'
                          : 'bg-white/10 hover:bg-white/15 text-white'
                      }`}
                    >
                      {previewLoading && previewPlan === plan.key ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Calculating...
                        </span>
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </button>
                  ) : isDowngrade ? (
                    <button
                      onClick={() => fetchPreview(plan.key)}
                      disabled={previewLoading && previewPlan === plan.key}
                      className="w-full py-2.5 font-medium rounded-xl text-sm transition-all bg-white/5 hover:bg-white/10 text-dark-300 hover:text-white border border-white/5 disabled:opacity-50"
                    >
                      {previewLoading && previewPlan === plan.key ? 'Calculating...' : `Downgrade to ${plan.name}`}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden mb-6">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Payment History</h2>
            <span className="text-xs text-dark-400">{payments.total} total</span>
          </div>
        </div>

        {payments.payments.length === 0 ? (
          <div className="text-center py-10">
            <svg className="w-10 h-10 text-dark-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
            <p className="text-dark-400 text-sm">No payment history yet</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/5">
              {payments.payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      p.type === 'REFUND' ? 'bg-red-500/10' :
                      p.type === 'UPGRADE' ? 'bg-emerald-500/10' :
                      p.type === 'DOWNGRADE' ? 'bg-amber-500/10' :
                      'bg-primary-500/10'
                    }`}>
                      {p.type === 'REFUND' ? (
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                      ) : p.type === 'UPGRADE' ? (
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                      ) : p.type === 'DOWNGRADE' ? (
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                      ) : (
                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{p.description || typeLabels[p.type] || p.type}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-dark-400">
                          {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {p.plan && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            p.plan === 'AGENCY' ? 'bg-accent-500/15 text-accent-400' :
                            p.plan === 'PRO' ? 'bg-primary-500/15 text-primary-400' :
                            'bg-dark-600 text-dark-300'
                          }`}>{p.plan}</span>
                        )}
                        {p.billingPeriodStart && p.billingPeriodEnd && (
                          <span className="text-[10px] text-dark-400">
                            {new Date(p.billingPeriodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(p.billingPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${p.type === 'REFUND' ? 'text-red-400' : 'text-white'}`}>
                      {p.type === 'REFUND' ? '-' : ''}${(p.amount || 0).toFixed(2)}
                    </p>
                    <p className={`text-[10px] font-medium ${statusColors[p.status] || 'text-dark-400'}`}>
                      {p.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {payments.total > 10 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                <p className="text-xs text-dark-400">
                  Page {paymentsPage} of {Math.ceil(payments.total / 10)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                    disabled={paymentsPage === 1}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPaymentsPage((p) => p + 1)}
                    disabled={paymentsPage * 10 >= payments.total}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Info + FAQ */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Payment Information */}
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">Payment Information</h2>
          <div className="space-y-3">
            <div className="bg-dark-900 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <span className="text-sm font-medium text-white">Payment Method</span>
              </div>
              {user?.plan !== 'FREE' ? (
                <p className="text-xs text-dark-300">Managed via Stripe. Your card details are securely stored by Stripe.</p>
              ) : (
                <p className="text-xs text-dark-400">No payment method on file. Upgrade to add one.</p>
              )}
            </div>
            <div className="bg-dark-900 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span className="text-sm font-medium text-white">Security</span>
              </div>
              <p className="text-xs text-dark-300">All payments processed securely through Stripe. We never store your card details. PCI DSS compliant.</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">FAQ</h2>
          <div className="space-y-3">
            {[
              { q: 'How does upgrading work?', a: 'You\'re charged the prorated difference for remaining days in your cycle. Full price starts next cycle.' },
              { q: 'What happens when I downgrade?', a: 'Current plan stays active until period end. Then you\'re moved to the lower plan automatically.' },
              { q: 'Can I cancel anytime?', a: 'Yes! Cancel anytime. Your plan stays active until the billing period ends, then reverts to Free.' },
              { q: 'Do you offer refunds?', a: 'We offer a 14-day money-back guarantee. Contact support if you\'re not satisfied.' },
            ].map((faq) => (
              <div key={faq.q}>
                <h4 className="text-xs font-medium text-white mb-0.5">{faq.q}</h4>
                <p className="text-[11px] text-dark-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
