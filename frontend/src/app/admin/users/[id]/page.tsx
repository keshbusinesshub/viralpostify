'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type UserDetail = {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    id: string;
    plan: string;
    status: string;
    stripeSubId?: string;
    nextBillingDate?: string;
    discountApplied: boolean;
    createdAt: string;
  };
  discounts: Array<{
    id: string;
    percentage: number;
    validUntil: string;
    used: boolean;
    couponId?: string;
    createdAt: string;
  }>;
  accounts: Array<{
    id: string;
    platform: string;
    accountName?: string;
    createdAt: string;
  }>;
  _count: {
    posts: number;
    tickets: number;
    media: number;
    apiKeys: number;
  };
};

const planPrices: Record<string, number> = { FREE: 0, PRO: 29, AGENCY: 99 };

const planColors: Record<string, string> = {
  FREE: 'bg-dark-600 text-dark-200',
  PRO: 'bg-primary-500/15 text-primary-400',
  AGENCY: 'bg-gradient-to-r from-primary-500/15 to-accent-500/15 text-accent-400',
};

const subStatusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400',
  CANCELED: 'bg-red-500/15 text-red-400',
  PAST_DUE: 'bg-amber-500/15 text-amber-400',
  TRIALING: 'bg-blue-500/15 text-blue-400',
  UNPAID: 'bg-orange-500/15 text-orange-400',
};

const platformIcons: Record<string, string> = {
  twitter: '𝕏',
  instagram: '📷',
  facebook: 'f',
  linkedin: 'in',
  tiktok: '♪',
  youtube: '▶',
  pinterest: '📌',
};

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(20);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const fetchUser = () => {
    setLoading(true);
    api.get<UserDetail>(`/admin/users/${id}`)
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUser(); }, [id]);
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
  }, [toast]);

  const handleChangePlan = async (plan: string) => {
    setActionLoading('plan');
    try {
      await api.put(`/admin/users/${id}/plan`, { plan });
      setToast({ type: 'success', message: `Plan changed to ${plan}` });
      setShowPlanModal(false);
      fetchUser();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to change plan' });
    } finally { setActionLoading(null); }
  };

  const handleRefund = async () => {
    setActionLoading('refund');
    try {
      const res = await api.post<any>(`/admin/users/${id}/refund`, { reason: refundReason });
      const refundMsg = res.refund?.amount
        ? ` Refunded $${res.refund.amount} ${res.refund.currency?.toUpperCase()}.`
        : res.refund?.error
          ? ` Stripe: ${res.refund.error}`
          : '';
      setToast({ type: 'success', message: `${res.message}${refundMsg}` });
      setShowRefundModal(false);
      setRefundReason('');
      fetchUser();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Refund failed' });
    } finally { setActionLoading(null); }
  };

  const handleApplyDiscount = async () => {
    setActionLoading('discount');
    try {
      await api.post(`/admin/users/${id}/apply-discount`, { percentage: discountPercent });
      setToast({ type: 'success', message: `${discountPercent}% discount applied` });
      setShowDiscountModal(false);
      fetchUser();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to apply discount' });
    } finally { setActionLoading(null); }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-dark-300 text-sm">Loading user...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-dark-300">User not found</p>
        <Link href="/admin/users" className="text-sm text-primary-400 mt-2 inline-block">Back to users</Link>
      </div>
    );
  }

  const totalSpent = planPrices[user.plan] || 0; // Current monthly
  const daysSinceJoined = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);

  return (
    <div className="max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className={`border rounded-xl px-5 py-3.5 mb-4 flex items-center justify-between text-sm ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="hover:opacity-70"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      )}

      {/* Back + Header */}
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-dark-400 hover:text-white transition-colors mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        All Users
      </Link>

      <div className="bg-dark-800 border border-white/5 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl font-bold text-white">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{user.name}</h1>
              <p className="text-sm text-dark-300">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-purple-500/15 text-purple-400' : 'bg-dark-600 text-dark-300'}`}>
                  {user.role}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${planColors[user.plan] || ''}`}>
                  {user.plan}
                </span>
                <span className="text-[11px] text-dark-500">Joined {new Date(user.createdAt).toLocaleDateString()} ({daysSinceJoined}d ago)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPlanModal(true)}
              className="text-xs bg-dark-700 hover:bg-dark-600 text-dark-200 px-3 py-2 rounded-lg transition-colors"
            >
              Change Plan
            </button>
            <button
              onClick={() => setShowDiscountModal(true)}
              className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-2 rounded-lg transition-colors"
            >
              Apply Discount
            </button>
            {user.plan !== 'FREE' && (
              <button
                onClick={() => setShowRefundModal(true)}
                className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg transition-colors"
              >
                Refund & Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-dark-800 border border-white/5 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{user._count.posts}</div>
          <div className="text-[11px] text-dark-400">Posts</div>
        </div>
        <div className="bg-dark-800 border border-white/5 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{user.accounts.length}</div>
          <div className="text-[11px] text-dark-400">Accounts</div>
        </div>
        <div className="bg-dark-800 border border-white/5 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{user._count.tickets}</div>
          <div className="text-[11px] text-dark-400">Tickets</div>
        </div>
        <div className="bg-dark-800 border border-white/5 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{user._count.media}</div>
          <div className="text-[11px] text-dark-400">Media Files</div>
        </div>
        <div className="bg-dark-800 border border-white/5 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{user._count.apiKeys}</div>
          <div className="text-[11px] text-dark-400">API Keys</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Subscription & Billing */}
        <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold text-white">Subscription & Billing</h2>
            <span className="text-xs text-dark-400">${totalSpent}/mo</span>
          </div>
          <div className="p-6 space-y-4">
            {user.subscription ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-300">Status</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${subStatusColors[user.subscription.status] || ''}`}>
                    {user.subscription.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-300">Plan</span>
                  <span className="text-sm text-white font-medium">{user.subscription.plan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-300">Stripe Sub ID</span>
                  <code className="text-xs text-dark-400 font-mono">{user.subscription.stripeSubId || 'N/A'}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-300">Discount Applied</span>
                  <span className={`text-xs ${user.subscription.discountApplied ? 'text-emerald-400' : 'text-dark-400'}`}>
                    {user.subscription.discountApplied ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-300">Subscribed Since</span>
                  <span className="text-xs text-dark-400">{new Date(user.subscription.createdAt).toLocaleDateString()}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-dark-400">No active subscription</p>
                <p className="text-xs text-dark-500 mt-1">User is on the Free plan</p>
              </div>
            )}

            {user.stripeCustomerId && (
              <div className="pt-3 mt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-300">Stripe Customer</span>
                  <code className="text-xs text-dark-400 font-mono">{user.stripeCustomerId}</code>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Connected Accounts</h2>
          </div>
          <div className="p-6">
            {user.accounts.length === 0 ? (
              <p className="text-sm text-dark-400 text-center py-4">No connected accounts</p>
            ) : (
              <div className="space-y-2">
                {user.accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between bg-dark-900 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-xs font-bold text-dark-200">
                        {platformIcons[acc.platform] || acc.platform.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-white">{acc.accountName || acc.platform}</span>
                        <span className="text-[11px] text-dark-500 block capitalize">{acc.platform}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-dark-500">{new Date(acc.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discount History */}
      <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white">Discount History</h2>
        </div>
        <div className="p-6">
          {user.discounts.length === 0 ? (
            <p className="text-sm text-dark-400 text-center py-4">No discounts applied</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left font-medium text-dark-400 text-xs px-4 py-2">Date</th>
                    <th className="text-left font-medium text-dark-400 text-xs px-4 py-2">Discount</th>
                    <th className="text-left font-medium text-dark-400 text-xs px-4 py-2">Valid Until</th>
                    <th className="text-left font-medium text-dark-400 text-xs px-4 py-2">Status</th>
                    <th className="text-left font-medium text-dark-400 text-xs px-4 py-2">Coupon ID</th>
                  </tr>
                </thead>
                <tbody>
                  {user.discounts.map((d) => (
                    <tr key={d.id} className="border-b border-white/5 last:border-b-0">
                      <td className="px-4 py-2.5 text-dark-300">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-emerald-400 font-medium">{d.percentage}% off</td>
                      <td className="px-4 py-2.5 text-dark-300">{new Date(d.validUntil).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${d.used ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                          {d.used ? 'Used' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <code className="text-xs text-dark-500 font-mono">{d.couponId || '—'}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}

      {/* Change Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowPlanModal(false)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-white text-lg mb-4">Change User Plan</h3>
            <p className="text-sm text-dark-300 mb-4">Select a new plan for <strong className="text-white">{user.name}</strong>. This will override their current {user.plan} plan.</p>
            <div className="space-y-2 mb-5">
              {['FREE', 'PRO', 'AGENCY'].map((plan) => (
                <button
                  key={plan}
                  onClick={() => handleChangePlan(plan)}
                  disabled={user.plan === plan || actionLoading === 'plan'}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40 ${
                    user.plan === plan
                      ? 'bg-primary-500/10 border border-primary-500/30 text-primary-400'
                      : 'bg-dark-700 hover:bg-dark-600 text-white border border-white/5'
                  }`}
                >
                  <span>{plan}</span>
                  <span className="text-dark-400">${planPrices[plan]}/mo</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowPlanModal(false)} className="w-full text-sm text-dark-400 hover:text-white py-2 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowRefundModal(false)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-red-400 text-lg mb-2">Refund & Cancel Subscription</h3>
            <p className="text-sm text-dark-300 mb-4">
              This will refund the latest payment via Stripe, cancel the subscription, and move <strong className="text-white">{user.name}</strong> to the Free plan.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Reason (optional)</label>
              <textarea
                className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-xl text-white text-sm placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[80px]"
                placeholder="e.g., Customer requested refund within 14-day guarantee"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefund}
                disabled={actionLoading === 'refund'}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {actionLoading === 'refund' ? 'Processing...' : 'Confirm Refund'}
              </button>
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2.5 bg-dark-700 text-dark-200 rounded-xl text-sm hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowDiscountModal(false)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-amber-400 text-lg mb-2">Apply Discount</h3>
            <p className="text-sm text-dark-300 mb-4">
              Apply a discount for <strong className="text-white">{user.name}</strong>. Valid for 30 days.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Discount Percentage</label>
              <div className="flex items-center gap-3">
                {[10, 20, 30, 50].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setDiscountPercent(pct)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      discountPercent === pct
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-dark-700 text-dark-300 border border-white/5 hover:bg-dark-600'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApplyDiscount}
                disabled={actionLoading === 'discount'}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl text-sm transition-opacity disabled:opacity-50"
              >
                {actionLoading === 'discount' ? 'Applying...' : `Apply ${discountPercent}% Off`}
              </button>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="px-4 py-2.5 bg-dark-700 text-dark-200 rounded-xl text-sm hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
