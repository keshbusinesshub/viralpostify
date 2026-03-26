'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Link from 'next/link';

type Message = {
  id: string;
  sender: string;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
};

type TicketData = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: { id: string; name: string; email: string };
  messages?: Message[];
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-500/10 text-blue-400',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-400',
  RESOLVED: 'bg-emerald-500/10 text-emerald-400',
  CLOSED: 'bg-dark-600 text-dark-300',
};

const priorityColors: Record<string, string> = {
  LOW: 'text-dark-300',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-red-400',
};

const categoryIcons: Record<string, string> = {
  BILLING: '💳',
  TECHNICAL: '🔧',
  ACCOUNT: '👤',
  FEATURE_REQUEST: '💡',
  OTHER: '📩',
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const fetchTicket = () => {
    api.get<TicketData>(`/tickets/${id}`)
      .then(setTicket)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTicket(); }, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/tickets/${id}/reply`, { message: reply });
      setReply('');
      fetchTicket();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!isAdmin) return;
    setStatusUpdating(true);
    try {
      await api.put(`/admin/tickets/${id}/status`, { status });
      setTicket((prev) => prev ? { ...prev, status } : prev);
    } catch {}
    finally { setStatusUpdating(false); }
  };

  // Quick reply templates for admin
  const quickReplies = [
    { label: 'Acknowledge', text: 'Thank you for reaching out! We have received your ticket and our team is looking into it. We\'ll get back to you shortly.' },
    { label: 'Need Info', text: 'Thank you for contacting support. Could you please provide more details about the issue? This will help us resolve it faster.' },
    { label: 'Resolved', text: 'We\'ve resolved this issue. Please let us know if you need any further assistance. Thank you for your patience!' },
  ];

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-dark-300 text-sm">Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 text-dark-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-dark-300">Ticket not found</p>
        <Link href={isAdmin ? '/admin/tickets' : '/dashboard/tickets'} className="text-sm text-primary-400 hover:text-primary-300 mt-2 inline-block">
          Back to tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Back Link */}
      <Link
        href={isAdmin ? '/admin/tickets' : '/dashboard/tickets'}
        className="inline-flex items-center gap-1.5 text-sm text-dark-400 hover:text-white transition-colors mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {isAdmin ? 'All Tickets' : 'My Tickets'}
      </Link>

      {/* Ticket Header */}
      <div className="bg-dark-800 border border-white/5 rounded-2xl p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{categoryIcons[ticket.category] || '📩'}</span>
              {ticket.subject}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="text-xs text-dark-400">{ticket.category?.replace('_', ' ')}</span>
              <span className={`text-xs font-medium ${priorityColors[ticket.priority] || ''}`}>
                {ticket.priority} Priority
              </span>
              <span className="text-xs text-dark-500">
                Created {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Status Badge / Dropdown */}
          <div className="shrink-0">
            {isAdmin ? (
              <select
                className={`text-xs font-medium rounded-full px-3 py-1.5 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 ${statusColors[ticket.status] || ''} [color-scheme:dark]`}
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusUpdating}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            ) : (
              <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusColors[ticket.status] || ''}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* User Info (Admin only) */}
        {isAdmin && ticket.user && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
              {ticket.user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-medium text-white">{ticket.user.name}</span>
              <span className="text-xs text-dark-400 ml-2">{ticket.user.email}</span>
            </div>
            <Link
              href={`/admin/users`}
              className="ml-auto text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              View Profile
            </Link>
          </div>
        )}
      </div>

      {/* Messages Thread */}
      <div className="space-y-3 mb-4">
        {ticket.messages?.map((msg) => {
          const isCurrentUser = msg.sender === user?.id;
          const isFromTicketOwner = msg.sender === ticket.userId;
          const senderLabel = isCurrentUser
            ? 'You'
            : isFromTicketOwner
              ? (ticket.user?.name || 'User')
              : 'Support Team';

          return (
            <div
              key={msg.id}
              className={`rounded-2xl p-5 ${
                isFromTicketOwner
                  ? 'bg-dark-800 border border-white/5 mr-12'
                  : 'bg-primary-500/8 border border-primary-500/15 ml-12'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  {!isFromTicketOwner && (
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <span className={`text-sm font-medium ${isFromTicketOwner ? 'text-dark-200' : 'text-primary-400'}`}>
                    {senderLabel}
                  </span>
                  {!isFromTicketOwner && (
                    <span className="text-[10px] bg-primary-500/15 text-primary-400 px-1.5 py-0.5 rounded-full">Staff</span>
                  )}
                </div>
                <span className="text-[11px] text-dark-500">
                  {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-dark-200 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
              {msg.attachmentUrl && (
                <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary-400 hover:text-primary-300">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  Attachment
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Reply Area */}
      {ticket.status !== 'CLOSED' ? (
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
          {/* Admin Quick Reply Templates */}
          {isAdmin && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] text-dark-500 mr-1">Quick reply:</span>
              {quickReplies.map((qr) => (
                <button
                  key={qr.label}
                  onClick={() => setReply(qr.text)}
                  className="text-[11px] text-dark-300 hover:text-white bg-dark-700 hover:bg-dark-600 px-2.5 py-1 rounded-lg transition-colors"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleReply}>
            <textarea
              className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white text-sm placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-y mb-3"
              placeholder={isAdmin ? 'Type your response to the user...' : 'Type your reply...'}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <label className="flex items-center gap-1.5 text-xs text-dark-400">
                    <input
                      type="checkbox"
                      className="rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                      onChange={(e) => {
                        if (e.target.checked && ticket.status === 'OPEN') {
                          handleStatusChange('IN_PROGRESS');
                        }
                      }}
                      checked={ticket.status !== 'OPEN'}
                      disabled={ticket.status !== 'OPEN'}
                    />
                    Mark as In Progress
                  </label>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && ticket.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (reply.trim()) {
                        setSending(true);
                        try {
                          await api.post(`/tickets/${id}/reply`, { message: reply });
                          setReply('');
                        } catch {}
                        setSending(false);
                      }
                      await handleStatusChange('RESOLVED');
                      fetchTicket();
                    }}
                    className="px-4 py-2.5 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 font-medium rounded-xl text-sm transition-colors"
                  >
                    {reply.trim() ? 'Reply & Resolve' : 'Mark Resolved'}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50 transition-opacity"
                >
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-dark-800 border border-white/5 rounded-2xl p-5 text-center">
          <p className="text-sm text-dark-400">This ticket is closed.</p>
          {isAdmin && (
            <button
              onClick={() => handleStatusChange('OPEN')}
              className="mt-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Reopen Ticket
            </button>
          )}
        </div>
      )}
    </div>
  );
}
