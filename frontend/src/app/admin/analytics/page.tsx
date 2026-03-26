'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Analytics {
  totalUsers: number;
  totalPosts: number;
  postsByStatus: Record<string, number>;
  usersByPlan: Record<string, number>;
  openTickets: number;
  activeSubscriptions: number;
  subscriptionsByStatus: Record<string, number>;
  totalAccounts: number;
  recentUsers: number;
  totalDiscounts: number;
  estimatedMRR: number;
}

const planColors: Record<string, string> = {
  FREE: 'bg-dark-500',
  PRO: 'bg-primary-500',
  AGENCY: 'bg-gradient-to-r from-primary-500 to-accent-500',
};

const planPrices: Record<string, number> = { FREE: 0, PRO: 29, AGENCY: 99 };

const statusColors: Record<string, string> = {
  DRAFT: 'bg-dark-500',
  SCHEDULED: 'bg-amber-500',
  POSTED: 'bg-emerald-500',
  FAILED: 'bg-red-500',
};

const subStatusColors: Record<string, string> = {
  ACTIVE: 'text-emerald-400',
  CANCELED: 'text-red-400',
  PAST_DUE: 'text-amber-400',
  TRIALING: 'text-blue-400',
  UNPAID: 'text-orange-400',
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Analytics>('/admin/analytics')
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-dark-300 text-sm">Loading analytics...</p>
      </div>
    );
  }

  if (!data) return <div className="text-center py-12 text-dark-300">Failed to load analytics.</div>;

  const totalPaying = (data.usersByPlan['PRO'] || 0) + (data.usersByPlan['AGENCY'] || 0);
  const conversionRate = data.totalUsers > 0 ? ((totalPaying / data.totalUsers) * 100).toFixed(1) : '0';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics & Revenue</h1>
        <p className="text-sm text-dark-300 mt-1">Overview of platform performance and revenue metrics</p>
      </div>

      {/* Revenue Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-dark-300">Estimated MRR</p>
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">${data.estimatedMRR.toLocaleString()}</p>
          <p className="text-[11px] text-dark-400 mt-1">~${(data.estimatedMRR * 12).toLocaleString()}/yr</p>
        </div>

        <div className="bg-gradient-to-br from-primary-500/15 to-primary-500/5 border border-primary-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-dark-300">Paying Customers</p>
            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <p className="text-3xl font-extrabold text-primary-400">{totalPaying}</p>
          <p className="text-[11px] text-dark-400 mt-1">{conversionRate}% conversion rate</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/15 to-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-dark-300">Total Users</p>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <p className="text-3xl font-extrabold text-blue-400">{data.totalUsers}</p>
          <p className="text-[11px] text-dark-400 mt-1">+{data.recentUsers} last 30 days</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-dark-300">Active Subscriptions</p>
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-3xl font-extrabold text-amber-400">{data.activeSubscriptions}</p>
          <p className="text-[11px] text-dark-400 mt-1">{data.totalDiscounts} discounts used</p>
        </div>
      </div>

      {/* Plans & Subscriptions */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Plan */}
        <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Revenue by Plan</h2>
          </div>
          <div className="p-6 space-y-4">
            {['AGENCY', 'PRO', 'FREE'].map((plan) => {
              const count = data.usersByPlan[plan] || 0;
              const revenue = count * (planPrices[plan] || 0);
              const percentage = data.totalUsers > 0 ? (count / data.totalUsers) * 100 : 0;

              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${planColors[plan]}`} />
                      <span className="text-sm font-medium text-white">{plan}</span>
                      <span className="text-xs text-dark-400">{count} users</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-white">${revenue.toLocaleString()}</span>
                      <span className="text-xs text-dark-400 ml-1">/mo</span>
                    </div>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div
                      className={`${planColors[plan]} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-sm text-dark-300">Total Monthly Revenue</span>
              <span className="text-lg font-bold text-emerald-400">${data.estimatedMRR.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Subscription Status</h2>
          </div>
          <div className="p-6">
            {Object.keys(data.subscriptionsByStatus).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-dark-400 text-sm">No subscriptions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.subscriptionsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between bg-dark-900 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-400' : status === 'CANCELED' ? 'bg-red-400' : status === 'PAST_DUE' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      <span className={`text-sm font-medium ${subStatusColors[status] || 'text-dark-200'}`}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-white">{count}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-dark-900 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-white">{data.totalAccounts}</div>
                <div className="text-[11px] text-dark-400">Connected Accounts</div>
              </div>
              <div className="bg-dark-900 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-white">{data.openTickets}</div>
                <div className="text-[11px] text-dark-400">Open Tickets</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts & Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Posts by Status */}
        <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold text-white">Posts Overview</h2>
            <span className="text-xs text-dark-400">{data.totalPosts} total</span>
          </div>
          <div className="p-6">
            {data.totalPosts === 0 ? (
              <div className="text-center py-8">
                <p className="text-dark-400 text-sm">No posts yet</p>
              </div>
            ) : (
              <>
                {/* Status bar */}
                <div className="flex w-full h-3 rounded-full overflow-hidden mb-4">
                  {['POSTED', 'SCHEDULED', 'DRAFT', 'FAILED'].map((status) => {
                    const count = data.postsByStatus[status] || 0;
                    const pct = data.totalPosts > 0 ? (count / data.totalPosts) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={status}
                        className={`${statusColors[status]} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {['POSTED', 'SCHEDULED', 'DRAFT', 'FAILED'].map((status) => {
                    const count = data.postsByStatus[status] || 0;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`} />
                          <span className="text-sm text-dark-200">{status}</span>
                        </div>
                        <span className="text-sm font-medium text-white">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Platform Health</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between bg-dark-900 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Avg Revenue per User</div>
                  <div className="text-[11px] text-dark-400">Across all users</div>
                </div>
              </div>
              <span className="text-lg font-bold text-white">
                ${data.totalUsers > 0 ? (data.estimatedMRR / data.totalUsers).toFixed(2) : '0.00'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-dark-900 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-500/15 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Conversion Rate</div>
                  <div className="text-[11px] text-dark-400">Free to paid</div>
                </div>
              </div>
              <span className="text-lg font-bold text-white">{conversionRate}%</span>
            </div>

            <div className="flex items-center justify-between bg-dark-900 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Accounts per User</div>
                  <div className="text-[11px] text-dark-400">Average connections</div>
                </div>
              </div>
              <span className="text-lg font-bold text-white">
                {data.totalUsers > 0 ? (data.totalAccounts / data.totalUsers).toFixed(1) : '0'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-dark-900 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Posts per User</div>
                  <div className="text-[11px] text-dark-400">Average activity</div>
                </div>
              </div>
              <span className="text-lg font-bold text-white">
                {data.totalUsers > 0 ? (data.totalPosts / data.totalUsers).toFixed(1) : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
