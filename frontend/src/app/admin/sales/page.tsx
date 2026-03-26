'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const periods = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: '1y', label: '1 Year' },
  { key: 'all', label: 'All Time' },
];

const typeLabels: Record<string, string> = {
  SUBSCRIPTION: 'New Subscription',
  UPGRADE: 'Upgrade',
  DOWNGRADE: 'Downgrade',
  RENEWAL: 'Renewal',
  REFUND: 'Refund',
};

const statusColors: Record<string, string> = {
  SUCCEEDED: 'bg-emerald-500/15 text-emerald-400',
  PENDING: 'bg-amber-500/15 text-amber-400',
  FAILED: 'bg-red-500/15 text-red-400',
  REFUNDED: 'bg-purple-500/15 text-purple-400',
};

const typeColors: Record<string, string> = {
  SUBSCRIPTION: 'text-primary-400',
  UPGRADE: 'text-emerald-400',
  DOWNGRADE: 'text-amber-400',
  RENEWAL: 'text-blue-400',
  REFUND: 'text-red-400',
};

const typeIcons: Record<string, string> = {
  SUBSCRIPTION: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  UPGRADE: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  DOWNGRADE: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
  RENEWAL: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  REFUND: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
};

export default function AdminSalesPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchSales = useCallback(() => {
    setLoading(true);
    api.get<any>(`/admin/sales?period=${period}&page=${page}&limit=15`)
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, page]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const handlePeriodChange = (p: string) => { setPeriod(p); setPage(1); };

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Export transactions to CSV
  const exportCSV = () => {
    if (!data?.transactions?.length) return;
    setExporting(true);
    const headers = ['Date', 'Time', 'User', 'Email', 'Type', 'Plan', 'Amount', 'Status', 'Description', 'Stripe Payment ID', 'Billing Period'];
    const rows = data.transactions.map((tx: any) => [
      fmtDate(tx.createdAt),
      fmtTime(tx.createdAt),
      tx.user?.name || '',
      tx.user?.email || '',
      typeLabels[tx.type] || tx.type,
      tx.plan || '',
      tx.amount?.toFixed(2) || '0.00',
      tx.status,
      tx.description || '',
      tx.stripePaymentId || '',
      tx.billingPeriodStart && tx.billingPeriodEnd
        ? `${fmtDate(tx.billingPeriodStart)} - ${fmtDate(tx.billingPeriodEnd)}`
        : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: string) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viralpostify-sales-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  // Filter transactions by type
  const filteredTransactions = filterType
    ? (data?.transactions || []).filter((tx: any) => tx.type === filterType)
    : data?.transactions || [];

  if (loading && !data) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-dark-300">Loading sales data...</p>
      </div>
    );
  }

  const s = data?.summary || {};
  const maxMonthlyRevenue = Math.max(1, ...(data?.revenueByMonth || []).map((m: any) => m.revenue));

  // Revenue growth indicator (compare first and last month)
  const months = (data?.revenueByMonth || []);
  const revenueGrowth = months.length >= 2
    ? ((months[0].revenue - months[1].revenue) / (months[1].revenue || 1) * 100).toFixed(1)
    : null;

  // ARPU calculation
  const totalPayingUsers = (data?.revenueByPlan || []).reduce((sum: number, r: any) => sum + r.count, 0) || 1;
  const arpu = (s.totalRevenue || 0) / totalPayingUsers;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales & Revenue</h1>
          <p className="text-sm text-dark-300 mt-1">Track payments, revenue, and financial performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            disabled={exporting || !(data?.transactions?.length)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-white/10 hover:border-white/20 text-white font-medium rounded-xl text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <div className="flex bg-dark-800 border border-white/10 rounded-xl p-1">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePeriodChange(p.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  period === p.key
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-300 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
          <p className="text-xs text-dark-400 uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-extrabold text-white mt-1">{fmt(s.totalRevenue || 0)}</p>
          <p className="text-xs text-dark-400 mt-1">{s.totalTransactions || 0} transactions</p>
        </div>
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
          <p className="text-xs text-dark-400 uppercase tracking-wider">Net Revenue</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{fmt(s.netRevenue || 0)}</p>
          <p className="text-xs text-dark-400 mt-1">
            After {s.refundCount || 0} refunds ({fmt(s.totalRefunds || 0)})
          </p>
        </div>
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
          <p className="text-xs text-dark-400 uppercase tracking-wider">MRR</p>
          <p className="text-2xl font-extrabold text-primary-400 mt-1">{fmt(s.mrr || 0)}</p>
          <p className="text-xs text-dark-400 mt-1">ARR: {fmt(s.arr || 0)}</p>
        </div>
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
          <p className="text-xs text-dark-400 uppercase tracking-wider">Avg Revenue/User</p>
          <p className="text-2xl font-extrabold text-blue-400 mt-1">{fmt(arpu)}</p>
          <p className="text-xs text-dark-400 mt-1">ARPU this period</p>
        </div>
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
          <p className="text-xs text-dark-400 uppercase tracking-wider">Lifetime Revenue</p>
          <p className="text-2xl font-extrabold text-accent-400 mt-1">{fmt(s.lifetimeRevenue || 0)}</p>
          <p className="text-xs text-dark-400 mt-1">Since launch</p>
        </div>
      </div>

      {/* Subscription Metrics + Growth */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wider">New Subscriptions</p>
              <p className="text-2xl font-extrabold text-white mt-1">{s.newSubscriptions || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wider">Cancellations</p>
              <p className="text-2xl font-extrabold text-white mt-1">{s.canceledSubscriptions || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wider">Churn Rate</p>
              <p className="text-2xl font-extrabold text-white mt-1">{s.churnRate || 0}%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wider">Revenue Growth</p>
              {revenueGrowth !== null ? (
                <p className={`text-2xl font-extrabold mt-1 ${parseFloat(revenueGrowth) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {parseFloat(revenueGrowth) >= 0 ? '+' : ''}{revenueGrowth}%
                </p>
              ) : (
                <p className="text-2xl font-extrabold text-dark-400 mt-1">—</p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-dark-400 mt-1">Month-over-month</p>
        </div>
      </div>

      {/* Revenue Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Revenue Trend</h3>
            {revenueGrowth !== null && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                parseFloat(revenueGrowth) >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              }`}>
                {parseFloat(revenueGrowth) >= 0 ? '+' : ''}{revenueGrowth}% MoM
              </span>
            )}
          </div>
          {months.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-dark-400 text-sm">No revenue data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {months.slice(0, 8).reverse().map((m: any, i: number) => {
                const pct = (m.revenue / maxMonthlyRevenue) * 100;
                const label = new Date(m.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                const isLatest = i === months.slice(0, 8).length - 1;
                return (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className={`text-xs w-14 shrink-0 ${isLatest ? 'text-white font-medium' : 'text-dark-400'}`}>{label}</span>
                    <div className="flex-1 bg-dark-700 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center justify-end pr-2 transition-all ${
                          isLatest
                            ? 'bg-gradient-to-r from-primary-500 to-accent-500'
                            : 'bg-gradient-to-r from-primary-500/60 to-accent-500/60'
                        }`}
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white">{fmt(m.revenue)}</span>
                      </div>
                    </div>
                    <span className="text-xs text-dark-400 w-8 text-right">{m.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue Breakdown</h3>

          {/* Revenue by Plan */}
          {(data?.revenueByPlan || []).length === 0 ? (
            <div className="text-center py-4">
              <p className="text-dark-400 text-sm">No plan revenue data</p>
            </div>
          ) : (
            <div className="space-y-4 mb-5">
              {(data?.revenueByPlan || []).map((r: any) => {
                const planColors: Record<string, string> = {
                  PRO: 'from-primary-500 to-blue-500',
                  AGENCY: 'from-accent-500 to-purple-500',
                  FREE: 'from-dark-500 to-dark-400',
                };
                const planBadgeColors: Record<string, string> = {
                  PRO: 'bg-primary-500/15 text-primary-400',
                  AGENCY: 'bg-accent-500/15 text-accent-400',
                  FREE: 'bg-dark-600 text-dark-300',
                };
                const totalPlanRevenue = (data?.revenueByPlan || []).reduce((s: number, p: any) => s + p.revenue, 0) || 1;
                const pct = (r.revenue / totalPlanRevenue) * 100;
                return (
                  <div key={r.plan}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${planBadgeColors[r.plan] || planBadgeColors.FREE}`}>
                          {r.plan}
                        </span>
                        <span className="text-xs text-dark-400">{r.count} payments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-dark-400">{pct.toFixed(1)}%</span>
                        <span className="text-sm font-bold text-white">{fmt(r.revenue)}</span>
                      </div>
                    </div>
                    <div className="bg-dark-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${planColors[r.plan] || planColors.FREE} rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Revenue by Type */}
          <div className="pt-4 border-t border-white/5">
            <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">By Transaction Type</h4>
            <div className="grid grid-cols-2 gap-2">
              {(data?.revenueByType || []).map((r: any) => (
                <button
                  key={r.type}
                  onClick={() => setFilterType(filterType === r.type ? null : r.type)}
                  className={`bg-dark-900 rounded-xl p-3 text-left transition-all border ${
                    filterType === r.type ? 'border-primary-500/50 ring-1 ring-primary-500/20' : 'border-transparent hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className={`w-3.5 h-3.5 ${typeColors[r.type] || 'text-dark-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcons[r.type] || typeIcons.RENEWAL} />
                    </svg>
                    <p className={`text-xs font-medium ${typeColors[r.type] || 'text-dark-300'}`}>
                      {typeLabels[r.type] || r.type}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-white">{fmt(r.revenue)}</p>
                  <p className="text-[10px] text-dark-400">{r.count} transactions</p>
                </button>
              ))}
            </div>
          </div>

          {/* Financial Health Indicators */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">Financial Health</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-dark-400">Refund Rate</p>
                <p className="text-sm font-bold text-white">
                  {s.totalTransactions ? ((s.refundCount || 0) / s.totalTransactions * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-dark-400">Net Margin</p>
                <p className="text-sm font-bold text-white">
                  {s.totalRevenue ? (((s.netRevenue || 0) / s.totalRevenue) * 100).toFixed(1) : 100}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-dark-400">Upgrade/Downgrade Ratio</p>
                <p className="text-sm font-bold text-white">
                  {(() => {
                    const upgrades = (data?.revenueByType || []).find((r: any) => r.type === 'UPGRADE')?.count || 0;
                    const downgrades = (data?.revenueByType || []).find((r: any) => r.type === 'DOWNGRADE')?.count || 0;
                    return downgrades > 0 ? (upgrades / downgrades).toFixed(1) + 'x' : upgrades > 0 ? upgrades + ':0' : '—';
                  })()}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-dark-400">Avg Transaction</p>
                <p className="text-sm font-bold text-white">
                  {fmt(s.totalTransactions ? (s.totalRevenue || 0) / s.totalTransactions : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">Transaction History</h3>
              {filterType && (
                <button
                  onClick={() => setFilterType(null)}
                  className="flex items-center gap-1 text-xs bg-primary-500/15 text-primary-400 px-2.5 py-1 rounded-full hover:bg-primary-500/25 transition-colors"
                >
                  {typeLabels[filterType]}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-xs text-dark-400">
              {filterType ? filteredTransactions.length : data?.transactionCount || 0} {filterType ? 'filtered' : 'total'}
            </span>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-dark-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
            <p className="text-dark-400 text-sm">
              {filterType ? `No ${typeLabels[filterType]?.toLowerCase()} transactions` : 'No transactions in this period'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-5 font-medium text-dark-300">Date</th>
                    <th className="text-left py-3 px-5 font-medium text-dark-300">User</th>
                    <th className="text-left py-3 px-5 font-medium text-dark-300">Type</th>
                    <th className="text-left py-3 px-5 font-medium text-dark-300">Plan</th>
                    <th className="text-left py-3 px-5 font-medium text-dark-300">Amount</th>
                    <th className="text-left py-3 px-5 font-medium text-dark-300">Status</th>
                    <th className="text-left py-3 px-5 font-medium text-dark-300">Billing Period</th>
                    <th className="text-left py-3 px-5 font-medium text-dark-300">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx: any) => (
                    <tr
                      key={tx.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => tx.user?.id && router.push(`/admin/users/${tx.user.id}`)}
                    >
                      <td className="py-3 px-5 whitespace-nowrap">
                        <p className="text-white text-xs">{fmtDate(tx.createdAt)}</p>
                        <p className="text-dark-400 text-[10px]">{fmtTime(tx.createdAt)}</p>
                      </td>
                      <td className="py-3 px-5">
                        {tx.user ? (
                          <div>
                            <p className="text-white text-xs font-medium">{tx.user.name}</p>
                            <p className="text-dark-400 text-[10px]">{tx.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-dark-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${typeColors[tx.type] || 'text-dark-300'}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcons[tx.type] || typeIcons.RENEWAL} />
                          </svg>
                          {typeLabels[tx.type] || tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        {tx.plan ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            tx.plan === 'AGENCY' ? 'bg-accent-500/15 text-accent-400' :
                            tx.plan === 'PRO' ? 'bg-primary-500/15 text-primary-400' :
                            'bg-dark-600 text-dark-300'
                          }`}>{tx.plan}</span>
                        ) : (
                          <span className="text-dark-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <span className={`text-sm font-bold ${
                          tx.type === 'REFUND' ? 'text-red-400' : 'text-white'
                        }`}>
                          {tx.type === 'REFUND' ? '-' : ''}{fmt(tx.amount || 0)}
                        </span>
                        {tx.refundedAmount ? (
                          <p className="text-[10px] text-red-400">Refund: {fmt(tx.refundedAmount)}</p>
                        ) : null}
                      </td>
                      <td className="py-3 px-5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[tx.status] || 'bg-dark-600 text-dark-300'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        {tx.billingPeriodStart && tx.billingPeriodEnd ? (
                          <p className="text-[10px] text-dark-300">
                            {new Date(tx.billingPeriodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(tx.billingPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        ) : (
                          <span className="text-dark-500 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <p className="text-xs text-dark-300 truncate max-w-[180px]">{tx.description || '—'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!filterType && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                <p className="text-xs text-dark-400">
                  Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, data?.transactionCount || 0)} of {data?.transactionCount || 0}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * 15 >= (data?.transactionCount || 0)}
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
    </div>
  );
}
