'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface ApiKey {
  id: string;
  name: string;
  key?: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revoked: boolean;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = () => {
    setLoading(true);
    api.get<ApiKey[]>('/api-keys').then((d) => setKeys(d || [])).catch(() => setKeys([])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.post<ApiKey>('/api-keys', {
        name: form.name,
        ...(form.expiresAt ? { expiresAt: form.expiresAt } : {}),
      });
      setNewKey(data.key || null);
      setShowForm(false);
      setForm({ name: '', expiresAt: '' });
      fetchKeys();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this API key? It will stop working immediately.')) return;
    try { await api.post(`/api-keys/${id}/revoke`, {}); fetchKeys(); } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this API key?')) return;
    try { await api.delete(`/api-keys/${id}`); setKeys((p) => p.filter((k) => k.id !== id)); } catch {}
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-sm text-dark-300 mt-1">Manage your API keys to access Viralpostify programmatically</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setNewKey(null); }} className="bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
          {showForm ? 'Cancel' : 'Create API Key'}
        </button>
      </div>

      {/* New key reveal */}
      {newKey && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="font-semibold text-emerald-400">API Key Created</h3>
          </div>
          <p className="text-sm text-dark-200 mb-3">Copy your API key now. You won&apos;t be able to see it again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono break-all">{newKey}</code>
            <button onClick={copyKey} className="shrink-0 px-4 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-medium transition-all">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-dark-800 border border-white/5 rounded-2xl p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-1.5">Key Name</label>
            <input required className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Production Server, My App" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-1.5">Expiration (optional)</label>
            <input type="date" className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:dark]" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50">{saving ? 'Creating...' : 'Create Key'}</button>
        </form>
      )}

      {/* Keys list */}
      {loading ? (
        <div className="text-center py-12 text-dark-300">Loading...</div>
      ) : keys.length === 0 ? (
        <div className="bg-dark-800 border border-white/5 rounded-2xl text-center py-16">
          <div className="text-4xl mb-3">
            <svg className="w-12 h-12 mx-auto text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          </div>
          <p className="text-dark-300">No API keys yet</p>
          <p className="text-sm text-dark-400 mt-1">Create one to start using the Viralpostify API</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div key={key.id} className={`bg-dark-800 border rounded-2xl p-5 transition-all ${key.revoked ? 'border-red-500/20 opacity-60' : 'border-white/5 hover:border-white/10'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{key.name}</h3>
                    {key.revoked && <span className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">Revoked</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <code className="text-xs text-dark-300 font-mono">{key.keyPrefix}...•••••••</code>
                    <span className="text-xs text-dark-400">Created {new Date(key.createdAt).toLocaleDateString()}</span>
                    {key.lastUsedAt && <span className="text-xs text-dark-400">Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                    {key.expiresAt && (
                      <span className={`text-xs ${new Date(key.expiresAt) < new Date() ? 'text-red-400' : 'text-dark-400'}`}>
                        {new Date(key.expiresAt) < new Date() ? 'Expired' : `Expires ${new Date(key.expiresAt).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!key.revoked && (
                    <button onClick={() => handleRevoke(key.id)} className="px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-medium transition-all">Revoke</button>
                  )}
                  <button onClick={() => handleDelete(key.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-all">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API Usage guide */}
      <div className="mt-8 bg-dark-800 border border-white/5 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Quick Start</h2>
        <p className="text-sm text-dark-200 mb-4">Use your API key to authenticate requests. Pass it via the <code className="bg-dark-700 px-1.5 py-0.5 rounded text-primary-400">x-api-key</code> header.</p>
        <div className="bg-dark-900 rounded-xl p-4 overflow-x-auto">
          <pre className="text-sm text-dark-100 font-mono whitespace-pre">{`# List your connected accounts
curl -H "x-api-key: YOUR_API_KEY" \\
  ${typeof window !== 'undefined' ? window.location.origin : 'https://viralpostify.com'}/api/accounts

# Create a post
curl -X POST -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Hello world!", "platform": "twitter"}' \\
  ${typeof window !== 'undefined' ? window.location.origin : 'https://viralpostify.com'}/api/posts

# Generate AI content
curl -X POST -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"type": "caption", "prompt": "Product launch"}' \\
  ${typeof window !== 'undefined' ? window.location.origin : 'https://viralpostify.com'}/api/ai/generate`}</pre>
        </div>
        <a href="/dashboard/api-docs" className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary-400 hover:text-primary-300 transition-colors">
          View full API documentation
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </a>
      </div>
    </div>
  );
}
