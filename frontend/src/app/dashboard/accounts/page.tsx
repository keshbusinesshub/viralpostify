'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const platforms = [
  {
    key: 'twitter',
    name: 'X (Twitter)',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: 'bg-black',
    textColor: 'text-white',
    description: 'Post tweets and threads',
    setupUrl: 'https://developer.x.com/en/portal/dashboard',
    envKeys: ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET'],
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    textColor: 'text-white',
    description: 'Share photos, reels & stories',
    setupUrl: 'https://developers.facebook.com/apps/',
    envKeys: ['INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET'],
  },
  {
    key: 'facebook',
    name: 'Facebook',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    color: 'bg-[#1877F2]',
    textColor: 'text-white',
    description: 'Post to pages & groups',
    setupUrl: 'https://developers.facebook.com/apps/',
    envKeys: ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET'],
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    color: 'bg-[#0A66C2]',
    textColor: 'text-white',
    description: 'Share professional updates',
    setupUrl: 'https://www.linkedin.com/developers/apps',
    envKeys: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
    color: 'bg-black',
    textColor: 'text-white',
    description: 'Upload short-form videos',
    setupUrl: 'https://developers.tiktok.com/apps/',
    envKeys: ['TIKTOK_CLIENT_ID', 'TIKTOK_CLIENT_SECRET'],
  },
  {
    key: 'youtube',
    name: 'YouTube',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    color: 'bg-[#FF0000]',
    textColor: 'text-white',
    description: 'Upload videos to your channel',
    setupUrl: 'https://console.cloud.google.com/apis/credentials',
    envKeys: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
  },
  {
    key: 'pinterest',
    name: 'Pinterest',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24 18.635 24 24 18.633 24 12.013 24 5.393 18.635 0 12.017 0z" />
      </svg>
    ),
    color: 'bg-[#E60023]',
    textColor: 'text-white',
    description: 'Pin images and ideas',
    setupUrl: 'https://developers.pinterest.com/apps/',
    envKeys: ['PINTEREST_CLIENT_ID', 'PINTEREST_CLIENT_SECRET'],
  },
];

interface ConnectedAccount {
  id: string;
  platform: string;
  accountName: string;
  platformUserId: string;
  createdAt: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [oauthStatus, setOauthStatus] = useState<Record<string, boolean>>({});
  const [setupModal, setSetupModal] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const searchParams = useSearchParams();

  const fetchAccounts = () => {
    setLoading(true);
    Promise.all([
      api.get<ConnectedAccount[]>('/accounts').catch(() => []),
      api.get<Record<string, boolean>>('/accounts/oauth/status').catch(() => ({})),
    ]).then(([accs, status]) => {
      setAccounts(accs || []);
      setOauthStatus(status || {});
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAccounts(); }, []);

  const connected = searchParams.get('connected');
  const connectedName = searchParams.get('name');
  const error = searchParams.get('error');

  const handleConnect = async (platform: string) => {
    // Check if platform is configured
    if (!oauthStatus[platform]) {
      // Admin sees setup guide, users see "coming soon"
      setSetupModal(platform);
      return;
    }

    setConnecting(platform);
    try {
      const data = await api.get<{ url: string }>(`/accounts/oauth/${platform}/authorize`);
      window.location.href = data.url;
    } catch (err: any) {
      if (err.message?.includes('not_configured')) {
        setSetupModal(platform);
      }
      setConnecting(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this account? You will need to re-authorize to use it again.')) return;
    try {
      await api.delete(`/accounts/${id}`);
      setAccounts((p) => p.filter((a) => a.id !== id));
    } catch {}
  };

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));
  const setupPlatform = platforms.find((p) => p.key === setupModal);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Connected Accounts</h1>
        <p className="text-sm text-dark-300 mt-1">Connect your social media accounts to start posting</p>
      </div>

      {/* Success toast */}
      {connected && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm text-emerald-300">
            Successfully connected <strong className="capitalize">{connected}</strong>
            {connectedName && <> as <strong>{connectedName}</strong></>}
          </p>
        </div>
      )}

      {/* Error toast */}
      {error && error !== 'not_configured' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm text-red-300">{decodeURIComponent(error)}</p>
        </div>
      )}

      {/* Connected accounts */}
      {!loading && accounts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">Active Connections</h2>
          <div className="space-y-2">
            {accounts.map((account) => {
              const p = platforms.find((pl) => pl.key === account.platform);
              return (
                <div key={account.id} className="bg-dark-800 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-all group">
                  <div className={`w-11 h-11 ${p?.color || 'bg-dark-600'} rounded-xl flex items-center justify-center ${p?.textColor || 'text-white'}`}>
                    {p?.icon || <span className="text-lg font-bold capitalize">{account.platform[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{account.accountName || account.platform}</p>
                    <p className="text-xs text-dark-400 capitalize">{p?.name || account.platform} &middot; Connected {new Date(account.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Connected
                    </span>
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-all opacity-0 group-hover:opacity-100"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available platforms */}
      <div>
        <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">
          {accounts.length > 0 ? 'Add More Accounts' : 'Choose a Platform'}
        </h2>
        {loading ? (
          <div className="text-center py-12 text-dark-300">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {platforms.map((p) => {
              const isConnected = connectedPlatforms.has(p.key);
              const isConfigured = oauthStatus[p.key];
              const isConnecting = connecting === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => handleConnect(p.key)}
                  disabled={isConnecting}
                  className={`relative bg-dark-800 border rounded-2xl p-5 text-left transition-all group ${
                    isConnected
                      ? 'border-emerald-500/20 hover:border-emerald-500/30'
                      : 'border-white/5 hover:border-white/15 hover:bg-dark-750'
                  } disabled:opacity-60`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${p.color} rounded-xl flex items-center justify-center ${p.textColor} shrink-0 transition-transform group-hover:scale-105`}>
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{p.name}</p>
                        {isConnected && (
                          <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        )}
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5">{p.description}</p>
                      {!isConfigured && !isConnected && (
                        <p className="text-[10px] text-amber-400/70 mt-1">{isAdmin ? 'Setup required' : 'Coming soon'}</p>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-5 right-5">
                    {isConnecting ? (
                      <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    ) : !isConfigured && !isConnected ? (
                      <svg className="w-5 h-5 text-amber-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-dark-500 group-hover:text-dark-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="mt-8 bg-dark-800 border border-white/5 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <p className="text-sm text-dark-200">
              Clicking a platform will redirect you to their login page. After you authorize Viralpostify,
              you&apos;ll be brought back here with your account connected. Your tokens are encrypted and stored securely.
            </p>
            <p className="text-xs text-dark-400 mt-2">
              You can connect multiple accounts per platform. Reconnect anytime to refresh expired tokens.
            </p>
          </div>
        </div>
      </div>

      {/* Modal — Admin sees setup guide, users see "coming soon" */}
      {setupModal && setupPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSetupModal(null)} />
          <div className="relative bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${setupPlatform.color} rounded-xl flex items-center justify-center ${setupPlatform.textColor}`}>
                  {setupPlatform.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {isAdmin ? `${setupPlatform.name} Setup Required` : `${setupPlatform.name} Coming Soon`}
                  </h3>
                  <p className="text-xs text-dark-400">
                    {isAdmin ? 'One-time OAuth configuration needed' : 'This platform is not available yet'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSetupModal(null)} className="text-dark-400 hover:text-white transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {isAdmin ? (
                /* Admin: full setup guide */
                <div className="space-y-5">
                  <p className="text-sm text-dark-200 leading-relaxed">
                    To enable {setupPlatform.name} login for all users, register a developer app <strong className="text-white">once</strong> and add the credentials to your server. After that, users will simply click &quot;Connect&quot; and sign in with their {setupPlatform.name} account.
                  </p>

                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                      <div>
                        <p className="text-sm text-white font-medium">Create a Developer App</p>
                        <p className="text-xs text-dark-400 mt-0.5">Register an OAuth app on the {setupPlatform.name} developer portal</p>
                        <a href={setupPlatform.setupUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 mt-1 transition-colors">
                          Open Developer Portal
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                      <div>
                        <p className="text-sm text-white font-medium">Set Callback URL</p>
                        <div className="bg-dark-900 rounded-lg px-3 py-2 mt-1.5">
                          <code className="text-xs text-primary-400 font-mono break-all">
                            {typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':4000') : 'http://localhost:4000'}/api/accounts/oauth/{setupPlatform.key}/callback
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                      <div>
                        <p className="text-sm text-white font-medium">Add to Environment Variables</p>
                        <div className="bg-dark-900 rounded-lg px-3 py-2 mt-1.5 space-y-1">
                          {setupPlatform.envKeys.map((key) => (
                            <div key={key} className="flex items-center gap-2">
                              <code className="text-xs text-dark-200 font-mono">{key}=</code>
                              <span className="text-xs text-dark-500">your_value_here</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
                      <div>
                        <p className="text-sm text-white font-medium">Restart the Backend</p>
                        <p className="text-xs text-dark-400 mt-0.5">After adding the credentials, restart the server and users can connect instantly</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular user: simple "coming soon" message */
                <div className="text-center py-4">
                  <div className={`w-16 h-16 ${setupPlatform.color} rounded-2xl flex items-center justify-center ${setupPlatform.textColor} mx-auto mb-4 opacity-50`}>
                    {setupPlatform.icon}
                  </div>
                  <p className="text-dark-200 text-sm leading-relaxed">
                    {setupPlatform.name} integration is coming soon! We&apos;re working on enabling this platform.
                    You&apos;ll be able to connect your account with just one click.
                  </p>
                  <p className="text-xs text-dark-400 mt-3">
                    Check back later or contact support for updates.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5">
              <button onClick={() => setSetupModal(null)} className="px-4 py-2 text-sm text-dark-200 hover:text-white transition-colors">
                Close
              </button>
              {isAdmin && (
                <a href={setupPlatform.setupUrl} target="_blank" rel="noopener noreferrer" className="px-5 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                  Go to Developer Portal
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
