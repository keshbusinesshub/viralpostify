'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', category: 'OTHER', priority: 'MEDIUM' });
  const [saving, setSaving] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    api.get<any[]>('/tickets').then((d) => setTickets(d || [])).catch(() => setTickets([])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await api.post('/tickets', form); setShowForm(false); setForm({ subject: '', message: '', category: 'OTHER', priority: 'MEDIUM' }); fetchTickets(); }
    catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-primary-500/15 text-primary-400',
    IN_PROGRESS: 'bg-amber-500/15 text-amber-400',
    RESOLVED: 'bg-emerald-500/15 text-emerald-400',
    CLOSED: 'bg-dark-500 text-dark-200',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
          {showForm ? 'Cancel' : 'New Ticket'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-dark-800 border border-white/5 rounded-2xl p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-1.5">Subject</label>
            <input required className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Category</label>
              <select className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:dark]" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="BILLING">Billing</option><option value="TECHNICAL">Technical</option><option value="ACCOUNT">Account</option><option value="FEATURE_REQUEST">Feature Request</option><option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Priority</label>
              <select className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:dark]" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-1.5">Message</label>
            <textarea required className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50">{saving ? 'Creating...' : 'Submit Ticket'}</button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-dark-300">Loading...</div>
      ) : tickets.length === 0 ? (
        <div className="bg-dark-800 border border-white/5 rounded-2xl text-center py-16">
          <div className="text-4xl mb-3">🎫</div>
          <p className="text-dark-300">No tickets yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`} className="block bg-dark-800 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">{ticket.subject}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-dark-400">{ticket.category}</span>
                    <span className="text-xs text-dark-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[ticket.status] || ''}`}>{ticket.status.replace('_', ' ')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
