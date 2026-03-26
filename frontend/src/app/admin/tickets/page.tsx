'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
  _count?: { messages: number };
};

const statusColors: Record<string, { bg: string; dot: string }> = {
  OPEN: { bg: 'bg-blue-500/10 text-blue-400', dot: 'bg-blue-400' },
  IN_PROGRESS: { bg: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400' },
  RESOLVED: { bg: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400' },
  CLOSED: { bg: 'bg-dark-600 text-dark-300', dot: 'bg-dark-400' },
};

const priorityConfig: Record<string, { label: string; color: string; icon: string }> = {
  LOW: { label: 'Low', color: 'text-dark-300', icon: '↓' },
  MEDIUM: { label: 'Medium', color: 'text-amber-400', icon: '→' },
  HIGH: { label: 'High', color: 'text-orange-400', icon: '↑' },
  URGENT: { label: 'Urgent', color: 'text-red-400', icon: '⚡' },
};

const categoryIcons: Record<string, string> = {
  BILLING: '💳',
  TECHNICAL: '🔧',
  ACCOUNT: '👤',
  FEATURE_REQUEST: '💡',
  OTHER: '📩',
};

export default function AdminTicketsPage() {
  const [data, setData] = useState<{ tickets: Ticket[]; total: number }>({ tickets: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const fetchTickets = () => {
    setLoading(true);
    api.get<any>('/admin/tickets?limit=100')
      .then((res) => setData(res || { tickets: [], total: 0 }))
      .catch(() => setData({ tickets: [], total: 0 }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      await api.put(`/admin/tickets/${ticketId}/status`, { status });
      setData((prev) => ({
        ...prev,
        tickets: prev.tickets.map((t) =>
          t.id === ticketId ? { ...t, status } : t,
        ),
      }));
    } catch {}
  };

  // Stats
  const stats = {
    total: data.tickets.length,
    open: data.tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: data.tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: data.tickets.filter((t) => t.status === 'RESOLVED').length,
    urgent: data.tickets.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length,
  };

  // Filtered tickets
  const filtered = data.tickets.filter((t) => {
    if (filter !== 'ALL' && t.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.user?.name?.toLowerCase().includes(q) ||
        t.user?.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort: URGENT/HIGH first, then by date
  const sorted = [...filtered].sort((a, b) => {
    const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const statusOrder: Record<string, number> = { OPEN: 0, IN_PROGRESS: 1, RESOLVED: 2, CLOSED: 3 };
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-sm text-dark-300 mt-1">Manage and respond to user support requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <button
          onClick={() => setFilter('ALL')}
          className={`bg-dark-800 border rounded-xl p-4 text-left transition-all ${filter === 'ALL' ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/5 hover:border-white/10'}`}
        >
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-dark-400 mt-0.5">Total</div>
        </button>
        <button
          onClick={() => setFilter('OPEN')}
          className={`bg-dark-800 border rounded-xl p-4 text-left transition-all ${filter === 'OPEN' ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5 hover:border-white/10'}`}
        >
          <div className="text-2xl font-bold text-blue-400">{stats.open}</div>
          <div className="text-xs text-dark-400 mt-0.5">Open</div>
        </button>
        <button
          onClick={() => setFilter('IN_PROGRESS')}
          className={`bg-dark-800 border rounded-xl p-4 text-left transition-all ${filter === 'IN_PROGRESS' ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/5 hover:border-white/10'}`}
        >
          <div className="text-2xl font-bold text-amber-400">{stats.inProgress}</div>
          <div className="text-xs text-dark-400 mt-0.5">In Progress</div>
        </button>
        <button
          onClick={() => setFilter('RESOLVED')}
          className={`bg-dark-800 border rounded-xl p-4 text-left transition-all ${filter === 'RESOLVED' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 hover:border-white/10'}`}
        >
          <div className="text-2xl font-bold text-emerald-400">{stats.resolved}</div>
          <div className="text-xs text-dark-400 mt-0.5">Resolved</div>
        </button>
        <button
          onClick={() => { setFilter('ALL'); setSearch(''); }}
          className={`bg-dark-800 border rounded-xl p-4 text-left transition-all ${stats.urgent > 0 ? 'border-red-500/30' : 'border-white/5'} hover:border-white/10`}
        >
          <div className={`text-2xl font-bold ${stats.urgent > 0 ? 'text-red-400' : 'text-dark-400'}`}>{stats.urgent}</div>
          <div className="text-xs text-dark-400 mt-0.5">High Priority</div>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by subject, user name, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/5 rounded-xl text-sm text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {(filter !== 'ALL' || search) && (
          <button
            onClick={() => { setFilter('ALL'); setSearch(''); }}
            className="text-xs text-dark-300 hover:text-white bg-dark-800 border border-white/5 px-3 py-2.5 rounded-xl transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-16 text-dark-300">
          <div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin mx-auto mb-3"></div>
          Loading tickets...
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-dark-800 border border-white/5 rounded-2xl text-center py-16">
          <svg className="w-12 h-12 text-dark-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-dark-300">{filter !== 'ALL' || search ? 'No matching tickets' : 'No tickets yet'}</p>
        </div>
      ) : (
        <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_140px_100px_100px_120px] gap-3 px-5 py-3 border-b border-white/5 text-xs font-medium text-dark-400 uppercase tracking-wider">
            <div>Ticket</div>
            <div>User</div>
            <div>Priority</div>
            <div>Status</div>
            <div className="text-right">Updated</div>
          </div>

          {/* Ticket Rows */}
          <div className="divide-y divide-white/5">
            {sorted.map((ticket) => {
              const sc = statusColors[ticket.status] || statusColors.OPEN;
              const pc = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;
              return (
                <div key={ticket.id} className="grid grid-cols-[1fr_140px_100px_100px_120px] gap-3 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors group">
                  {/* Subject & Category */}
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/tickets/${ticket.id}`}
                      className="font-medium text-sm text-white hover:text-primary-400 transition-colors truncate block"
                    >
                      <span className="mr-2">{categoryIcons[ticket.category] || '📩'}</span>
                      {ticket.subject}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-dark-500">{ticket.category?.replace('_', ' ')}</span>
                      <span className="text-[11px] text-dark-500">{ticket._count?.messages || 0} messages</span>
                    </div>
                  </div>

                  {/* User */}
                  <div className="min-w-0">
                    <div className="text-xs text-dark-200 truncate">{ticket.user?.name || 'Unknown'}</div>
                    <div className="text-[11px] text-dark-500 truncate">{ticket.user?.email}</div>
                  </div>

                  {/* Priority */}
                  <div>
                    <span className={`text-xs font-medium ${pc.color} flex items-center gap-1`}>
                      <span>{pc.icon}</span>
                      {pc.label}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <select
                      className={`text-[11px] font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 ${sc.bg} [color-scheme:dark]`}
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  {/* Time */}
                  <div className="text-right">
                    <span className="text-xs text-dark-400">{timeAgo(ticket.updatedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Showing count */}
      {!loading && sorted.length > 0 && (
        <div className="text-xs text-dark-500 mt-3 text-center">
          Showing {sorted.length} of {data.total} tickets
        </div>
      )}
    </div>
  );
}
