'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/* ─── Data ─── */

const sections = [
  {
    id: 'authentication',
    title: 'Authentication',
    endpoints: [
      {
        id: 'login',
        method: 'POST',
        path: '/api/auth/login',
        title: 'Login',
        description: 'Authenticate with email and password to receive a JWT token.',
        auth: false,
        params: [
          { name: 'email', type: 'string', required: true, desc: 'User email address' },
          { name: 'password', type: 'string', required: true, desc: 'User password (min 8 chars)' },
        ],
        body: `{
  "email": "user@example.com",
  "password": "your-password"
}`,
        response: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "USER",
    "plan": "PRO"
  }
}`,
      },
      {
        id: 'register',
        method: 'POST',
        path: '/api/auth/register',
        title: 'Register',
        description: 'Create a new user account and receive a JWT token.',
        auth: false,
        params: [
          { name: 'name', type: 'string', required: true, desc: 'Display name' },
          { name: 'email', type: 'string', required: true, desc: 'Email address' },
          { name: 'password', type: 'string', required: true, desc: 'Password (min 8 chars)' },
        ],
        body: `{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securepassword"
}`,
        response: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "USER",
    "plan": "FREE"
  }
}`,
      },
      {
        id: 'get-me',
        method: 'GET',
        path: '/api/auth/me',
        title: 'Get Current User',
        description: 'Retrieve the authenticated user profile.',
        auth: true,
        params: [],
        response: `{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "USER",
  "plan": "PRO",
  "createdAt": "2024-01-15T10:30:00Z"
}`,
      },
    ],
  },
  {
    id: 'accounts',
    title: 'Accounts',
    endpoints: [
      {
        id: 'list-accounts',
        method: 'GET',
        path: '/api/accounts',
        title: 'List Accounts',
        description: 'Retrieve all connected social media accounts for the authenticated user.',
        auth: true,
        params: [],
        response: `[
  {
    "id": "a1b2c3d4-...",
    "platform": "twitter",
    "accountName": "@viralpostify",
    "platformUserId": "123456789",
    "createdAt": "2024-06-01T12:00:00Z"
  },
  {
    "id": "e5f6g7h8-...",
    "platform": "instagram",
    "accountName": "@viralpostify_ig",
    "platformUserId": "987654321",
    "createdAt": "2024-06-02T14:30:00Z"
  }
]`,
      },
      {
        id: 'connect-account',
        method: 'POST',
        path: '/api/accounts/connect',
        title: 'Connect Account',
        description: 'Manually connect a social media account with access tokens. For OAuth-based connections, use the dashboard instead.',
        auth: true,
        params: [
          { name: 'platform', type: 'string', required: true, desc: 'Platform name: twitter, instagram, facebook, linkedin, tiktok, youtube, pinterest' },
          { name: 'accessToken', type: 'string', required: true, desc: 'Platform access token' },
          { name: 'refreshToken', type: 'string', required: false, desc: 'Platform refresh token' },
          { name: 'accountName', type: 'string', required: true, desc: 'Display name or handle' },
          { name: 'platformUserId', type: 'string', required: true, desc: 'User ID on the platform' },
        ],
        body: `{
  "platform": "twitter",
  "accessToken": "oauth-access-token",
  "refreshToken": "oauth-refresh-token",
  "accountName": "@viralpostify",
  "platformUserId": "123456789"
}`,
        response: `{
  "id": "a1b2c3d4-...",
  "platform": "twitter",
  "accountName": "@viralpostify",
  "createdAt": "2024-06-01T12:00:00Z"
}`,
      },
      {
        id: 'disconnect-account',
        method: 'DELETE',
        path: '/api/accounts/:id',
        title: 'Disconnect Account',
        description: 'Remove a connected social media account.',
        auth: true,
        params: [
          { name: 'id', type: 'string', required: true, desc: 'Account UUID (path parameter)' },
        ],
        response: `{
  "deleted": true
}`,
      },
    ],
  },
  {
    id: 'posts',
    title: 'Posts',
    endpoints: [
      {
        id: 'list-posts',
        method: 'GET',
        path: '/api/posts',
        title: 'List Posts',
        description: 'Retrieve all posts for the authenticated user. Supports filtering by status and pagination.',
        auth: true,
        params: [
          { name: 'status', type: 'string', required: false, desc: 'Filter by status: DRAFT, SCHEDULED, POSTED, FAILED' },
          { name: 'page', type: 'number', required: false, desc: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', required: false, desc: 'Items per page (default: 20, max: 100)' },
        ],
        response: `{
  "posts": [
    {
      "id": "p1a2b3c4-...",
      "content": "Hello world! 🚀",
      "platform": "twitter",
      "status": "SCHEDULED",
      "scheduledTime": "2024-12-25T10:00:00Z",
      "mediaUrl": null,
      "createdAt": "2024-06-15T09:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}`,
      },
      {
        id: 'create-post',
        method: 'POST',
        path: '/api/posts',
        title: 'Create Post',
        description: 'Create a new social media post. Set scheduledTime to schedule it for later, or omit to save as draft.',
        auth: true,
        params: [
          { name: 'content', type: 'string', required: true, desc: 'Post content text' },
          { name: 'platform', type: 'string', required: true, desc: 'Target platform' },
          { name: 'mediaUrl', type: 'string', required: false, desc: 'URL of attached media' },
          { name: 'scheduledTime', type: 'string', required: false, desc: 'ISO 8601 datetime for scheduling' },
        ],
        body: `{
  "content": "Launching our new feature today! 🎉",
  "platform": "twitter",
  "mediaUrl": "https://s3.amazonaws.com/.../banner.jpg",
  "scheduledTime": "2024-12-25T10:00:00Z"
}`,
        response: `{
  "id": "p1a2b3c4-...",
  "content": "Launching our new feature today! 🎉",
  "platform": "twitter",
  "status": "SCHEDULED",
  "scheduledTime": "2024-12-25T10:00:00Z",
  "mediaUrl": "https://s3.amazonaws.com/.../banner.jpg",
  "createdAt": "2024-06-15T09:00:00Z"
}`,
      },
      {
        id: 'get-post',
        method: 'GET',
        path: '/api/posts/:id',
        title: 'Get Post',
        description: 'Retrieve a single post by its ID.',
        auth: true,
        params: [
          { name: 'id', type: 'string', required: true, desc: 'Post UUID (path parameter)' },
        ],
        response: `{
  "id": "p1a2b3c4-...",
  "content": "Hello world! 🚀",
  "platform": "twitter",
  "status": "POSTED",
  "scheduledTime": "2024-12-25T10:00:00Z",
  "mediaUrl": null,
  "createdAt": "2024-06-15T09:00:00Z"
}`,
      },
      {
        id: 'delete-post',
        method: 'DELETE',
        path: '/api/posts/:id',
        title: 'Delete Post',
        description: 'Permanently delete a post.',
        auth: true,
        params: [
          { name: 'id', type: 'string', required: true, desc: 'Post UUID (path parameter)' },
        ],
        response: `{
  "deleted": true
}`,
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI Content Generation',
    endpoints: [
      {
        id: 'generate-content',
        method: 'POST',
        path: '/api/ai/generate',
        title: 'Generate Content',
        description: 'Generate AI-powered social media content. Supports captions, hashtags, and full posts tailored to specific platforms.',
        auth: true,
        params: [
          { name: 'type', type: 'string', required: true, desc: 'Content type: caption, hashtags, full_post' },
          { name: 'prompt', type: 'string', required: true, desc: 'Description of what to generate' },
          { name: 'platform', type: 'string', required: false, desc: 'Target platform for tone/length optimization' },
        ],
        body: `{
  "type": "full_post",
  "prompt": "Product launch announcement for a SaaS scheduling tool",
  "platform": "twitter"
}`,
        response: `{
  "content": "🚀 Big news! We just launched Viralpostify — the all-in-one social media scheduling tool your team has been waiting for. AI-powered content, cross-platform posting, and beautiful analytics. Try it free today!",
  "type": "full_post"
}`,
      },
    ],
  },
  {
    id: 'media',
    title: 'Media',
    endpoints: [
      {
        id: 'list-media',
        method: 'GET',
        path: '/api/media',
        title: 'List Media',
        description: 'Retrieve all uploaded media files for the authenticated user.',
        auth: true,
        params: [],
        response: `[
  {
    "id": "m1a2b3c4-...",
    "fileUrl": "https://s3.amazonaws.com/.../photo.jpg",
    "fileName": "photo.jpg",
    "fileSize": 102400,
    "type": "IMAGE",
    "createdAt": "2024-06-10T08:15:00Z"
  }
]`,
      },
      {
        id: 'upload-media',
        method: 'POST',
        path: '/api/media/upload',
        title: 'Upload Media',
        description: 'Upload a media file using multipart/form-data. Accepts images and videos up to 50MB.',
        auth: true,
        params: [
          { name: 'file', type: 'file', required: true, desc: 'Media file (multipart/form-data field)' },
        ],
        body: `# Use multipart/form-data
curl -X POST \\
  -H "x-api-key: kp_live_your_key" \\
  -F "file=@/path/to/photo.jpg" \\
  https://viralpostify.com/api/media/upload`,
        response: `{
  "id": "m1a2b3c4-...",
  "fileUrl": "https://s3.amazonaws.com/.../photo.jpg",
  "fileName": "photo.jpg",
  "fileSize": 102400,
  "type": "IMAGE"
}`,
      },
      {
        id: 'delete-media',
        method: 'DELETE',
        path: '/api/media/:id',
        title: 'Delete Media',
        description: 'Delete an uploaded media file.',
        auth: true,
        params: [
          { name: 'id', type: 'string', required: true, desc: 'Media UUID (path parameter)' },
        ],
        response: `{
  "deleted": true
}`,
      },
    ],
  },
  {
    id: 'api-keys',
    title: 'API Keys',
    endpoints: [
      {
        id: 'list-keys',
        method: 'GET',
        path: '/api/api-keys',
        title: 'List API Keys',
        description: 'Retrieve all API keys for the authenticated user. Requires JWT authentication — API keys cannot list other keys.',
        auth: true,
        params: [],
        response: `[
  {
    "id": "k1a2b3c4-...",
    "name": "Production Server",
    "keyPrefix": "kp_live_a1b2",
    "lastUsedAt": "2024-06-20T15:30:00Z",
    "expiresAt": null,
    "revoked": false,
    "createdAt": "2024-06-01T10:00:00Z"
  }
]`,
      },
      {
        id: 'create-key',
        method: 'POST',
        path: '/api/api-keys',
        title: 'Create API Key',
        description: 'Generate a new API key. The full key is returned only once in the response — store it securely. Requires JWT authentication.',
        auth: true,
        params: [
          { name: 'name', type: 'string', required: true, desc: 'Descriptive name for the key' },
          { name: 'expiresAt', type: 'string', required: false, desc: 'ISO 8601 expiration date' },
        ],
        body: `{
  "name": "Production Server",
  "expiresAt": "2025-12-31T00:00:00Z"
}`,
        response: `{
  "id": "k1a2b3c4-...",
  "name": "Production Server",
  "key": "kp_live_a1b2c3d4e5f6g7h8i9j0...",
  "keyPrefix": "kp_live_a1b2",
  "expiresAt": "2025-12-31T00:00:00Z",
  "createdAt": "2024-06-01T10:00:00Z"
}`,
      },
      {
        id: 'revoke-key',
        method: 'POST',
        path: '/api/api-keys/:id/revoke',
        title: 'Revoke API Key',
        description: 'Revoke an API key without deleting it. Revoked keys cannot be used for authentication. Requires JWT authentication.',
        auth: true,
        params: [
          { name: 'id', type: 'string', required: true, desc: 'API key UUID (path parameter)' },
        ],
        response: `{
  "revoked": true
}`,
      },
      {
        id: 'delete-key',
        method: 'DELETE',
        path: '/api/api-keys/:id',
        title: 'Delete API Key',
        description: 'Permanently delete an API key. Requires JWT authentication.',
        auth: true,
        params: [
          { name: 'id', type: 'string', required: true, desc: 'API key UUID (path parameter)' },
        ],
        response: `{
  "deleted": true
}`,
      },
    ],
  },
];

const methodColors: Record<string, { bg: string; text: string; dot: string }> = {
  GET: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  POST: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  PUT: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  PATCH: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

const errorCodes = [
  { code: '200', label: 'OK', desc: 'Request succeeded', color: 'text-emerald-400' },
  { code: '201', label: 'Created', desc: 'Resource created successfully', color: 'text-emerald-400' },
  { code: '400', label: 'Bad Request', desc: 'Invalid or missing parameters', color: 'text-amber-400' },
  { code: '401', label: 'Unauthorized', desc: 'Missing or invalid API key / JWT token', color: 'text-red-400' },
  { code: '403', label: 'Forbidden', desc: 'Insufficient permissions for this resource', color: 'text-red-400' },
  { code: '404', label: 'Not Found', desc: 'Resource does not exist', color: 'text-red-400' },
  { code: '429', label: 'Too Many Requests', desc: 'Rate limit exceeded — retry after cooldown', color: 'text-orange-400' },
  { code: '500', label: 'Internal Error', desc: 'Something went wrong on our end', color: 'text-red-400' },
];

/* ─── Component ─── */

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState('authentication');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track scroll position for active sidebar highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    const sectionEls = document.querySelectorAll('[data-section]');
    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex gap-0 lg:gap-8 max-w-[1400px]">
      {/* ── Left Sidebar: Table of Contents ── */}
      <nav className="hidden lg:block w-56 shrink-0 sticky top-6 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-dark-400 mb-3">On this page</h3>
        </div>
        <div className="space-y-0.5">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left text-[13px] px-3 py-1.5 rounded-lg transition-all ${
                  activeSection === section.id
                    ? 'text-primary-400 bg-primary-500/10 font-medium'
                    : 'text-dark-300 hover:text-dark-100 hover:bg-white/5'
                }`}
              >
                {section.title}
              </button>
              {activeSection === section.id && (
                <div className="ml-3 mt-0.5 space-y-0.5">
                  {section.endpoints.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => scrollToSection(ep.id)}
                      className="w-full text-left text-[12px] text-dark-400 hover:text-dark-200 px-3 py-1 rounded transition-colors truncate"
                    >
                      <span className={`${methodColors[ep.method].text} font-mono text-[10px] mr-1.5`}>{ep.method}</span>
                      {ep.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="pt-2 border-t border-white/5 mt-2">
            <button onClick={() => scrollToSection('getting-started')} className="w-full text-left text-[13px] text-dark-300 hover:text-dark-100 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">Getting Started</button>
            <button onClick={() => scrollToSection('rate-limits')} className="w-full text-left text-[13px] text-dark-300 hover:text-dark-100 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">Rate Limits</button>
            <button onClick={() => scrollToSection('error-codes')} className="w-full text-left text-[13px] text-dark-300 hover:text-dark-100 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">Error Codes</button>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div ref={contentRef} className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">API Reference</h1>
              <p className="text-dark-300 text-sm">v1.0</p>
            </div>
          </div>
          <p className="text-dark-300 mt-3 text-[15px] leading-relaxed max-w-2xl">
            The Viralpostify API lets you manage social media accounts, create and schedule posts, generate AI content, and upload media — all programmatically.
          </p>
        </div>

        {/* Getting Started */}
        <div id="getting-started" data-section className="mb-8 scroll-mt-6">
          <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white text-lg">Getting Started</h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Base URL */}
              <div>
                <h3 className="text-sm font-medium text-dark-200 mb-2">Base URL</h3>
                <div className="relative">
                  <pre className="bg-dark-900 rounded-xl px-4 py-3 text-sm text-primary-400 font-mono overflow-x-auto">
                    https://viralpostify.com/api
                  </pre>
                </div>
              </div>

              {/* Authentication */}
              <div>
                <h3 className="text-sm font-medium text-dark-200 mb-3">Authentication</h3>
                <p className="text-sm text-dark-300 mb-4">All authenticated endpoints accept two methods. We recommend API keys for server-to-server integrations.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-dark-900 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-primary-400"></span>
                      <span className="text-sm font-medium text-white">API Key</span>
                      <span className="text-[10px] bg-primary-500/15 text-primary-400 px-1.5 py-0.5 rounded-full ml-auto">Recommended</span>
                    </div>
                    <p className="text-xs text-dark-400 mb-3">Include your API key in the request header.</p>
                    <code className="text-xs text-dark-200 font-mono block bg-dark-800 rounded-lg p-2.5 break-all">
                      x-api-key: kp_live_your_key_here
                    </code>
                  </div>
                  <div className="bg-dark-900 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span className="text-sm font-medium text-white">Bearer Token</span>
                    </div>
                    <p className="text-xs text-dark-400 mb-3">Use a JWT from the login endpoint.</p>
                    <code className="text-xs text-dark-200 font-mono block bg-dark-800 rounded-lg p-2.5 break-all">
                      Authorization: Bearer eyJhbG...
                    </code>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <Link href="/dashboard/api-keys" className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    Manage API Keys
                  </Link>
                </div>
              </div>

              {/* Quick Example */}
              <div>
                <h3 className="text-sm font-medium text-dark-200 mb-2">Quick Example</h3>
                <div className="relative group">
                  <pre className="bg-dark-900 rounded-xl p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                    <span className="text-dark-400"># List your connected accounts</span>{'\n'}
                    <span className="text-amber-400">curl</span> <span className="text-dark-200">-X GET https://viralpostify.com/api/accounts</span> <span className="text-primary-400">\</span>{'\n'}
                    <span className="text-dark-200">{'  '}-H</span> <span className="text-emerald-400">&quot;x-api-key: kp_live_your_key&quot;</span>
                  </pre>
                  <button
                    onClick={() => copyToClipboard('curl -X GET https://viralpostify.com/api/accounts \\\n  -H "x-api-key: kp_live_your_key"', 'quick-example')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-dark-800 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy"
                  >
                    {copied === 'quick-example' ? (
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Endpoint Sections ── */}
        {sections.map((section) => (
          <div key={section.id} id={section.id} data-section className="mb-8 scroll-mt-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
              <span className="text-xs text-dark-500 bg-dark-800 px-2 py-0.5 rounded-full">{section.endpoints.length} endpoint{section.endpoints.length > 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-3">
              {section.endpoints.map((ep) => {
                const mc = methodColors[ep.method];
                const isExpanded = expandedEndpoint === ep.id;

                return (
                  <div
                    key={ep.id}
                    id={ep.id}
                    className={`bg-dark-800 border rounded-2xl overflow-hidden transition-all scroll-mt-6 ${
                      isExpanded ? 'border-white/10' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Endpoint Header */}
                    <button
                      onClick={() => setExpandedEndpoint(isExpanded ? null : ep.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left group"
                    >
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md font-mono ${mc.bg} ${mc.text} min-w-[52px] text-center`}>
                        {ep.method}
                      </span>
                      <code className="text-sm text-dark-100 font-mono flex-1 truncate">{ep.path}</code>
                      <span className="text-xs text-dark-400 hidden sm:block mr-2">{ep.title}</span>
                      {ep.auth && (
                        <svg className="w-3.5 h-3.5 text-dark-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Requires authentication">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                      <svg className={`w-4 h-4 text-dark-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-white/5">
                        <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-white/5">
                          {/* Left: Info + Parameters */}
                          <div className="p-5 space-y-5">
                            <p className="text-sm text-dark-200 leading-relaxed">{ep.description}</p>

                            {ep.auth && (
                              <div className="flex items-center gap-2 text-xs text-dark-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Requires authentication (API Key or Bearer Token)
                              </div>
                            )}

                            {/* Parameters Table */}
                            {ep.params && ep.params.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Parameters</h4>
                                <div className="bg-dark-900 rounded-xl overflow-hidden border border-white/5">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-white/5">
                                        <th className="text-left font-medium text-dark-400 px-3 py-2">Name</th>
                                        <th className="text-left font-medium text-dark-400 px-3 py-2">Type</th>
                                        <th className="text-left font-medium text-dark-400 px-3 py-2 hidden sm:table-cell">Description</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ep.params.map((p) => (
                                        <tr key={p.name} className="border-b border-white/5 last:border-b-0">
                                          <td className="px-3 py-2 font-mono text-dark-100">
                                            {p.name}
                                            {p.required && <span className="text-red-400 ml-0.5">*</span>}
                                          </td>
                                          <td className="px-3 py-2 text-dark-400">{p.type}</td>
                                          <td className="px-3 py-2 text-dark-400 hidden sm:table-cell">{p.desc}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Request Body */}
                            {ep.body && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Request Body</h4>
                                  <button
                                    onClick={() => copyToClipboard(ep.body!, `body-${ep.id}`)}
                                    className="text-dark-500 hover:text-dark-300 transition-colors"
                                    title="Copy"
                                  >
                                    {copied === `body-${ep.id}` ? (
                                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    )}
                                  </button>
                                </div>
                                <pre className="bg-dark-900 rounded-xl p-4 text-xs text-blue-300 font-mono overflow-x-auto whitespace-pre border border-white/5 leading-relaxed">{ep.body}</pre>
                              </div>
                            )}
                          </div>

                          {/* Right: Response */}
                          <div className="p-5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Response</h4>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full">200 OK</span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(ep.response, `resp-${ep.id}`)}
                                className="text-dark-500 hover:text-dark-300 transition-colors"
                                title="Copy"
                              >
                                {copied === `resp-${ep.id}` ? (
                                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                )}
                              </button>
                            </div>
                            <pre className="bg-dark-900 rounded-xl p-4 text-xs text-emerald-300 font-mono overflow-x-auto whitespace-pre border border-white/5 leading-relaxed h-full min-h-[120px]">{ep.response}</pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Rate Limits */}
        <div id="rate-limits" data-section className="mb-6 scroll-mt-6">
          <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white text-lg">Rate Limits</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-dark-900 rounded-xl p-4 border border-white/5 text-center">
                  <div className="text-2xl font-bold text-white mb-1">60</div>
                  <div className="text-xs text-dark-400">Requests per minute</div>
                </div>
                <div className="bg-dark-900 rounded-xl p-4 border border-white/5 text-center">
                  <div className="text-2xl font-bold text-white mb-1">50 MB</div>
                  <div className="text-xs text-dark-400">Max upload size</div>
                </div>
                <div className="bg-dark-900 rounded-xl p-4 border border-white/5 text-center">
                  <div className="text-2xl font-bold text-white mb-1">100</div>
                  <div className="text-xs text-dark-400">Items per page (max)</div>
                </div>
              </div>
              <p className="text-sm text-dark-300 mt-4">
                When the rate limit is exceeded, you&apos;ll receive a <code className="bg-dark-700 px-1.5 py-0.5 rounded text-orange-400 text-xs">429 Too Many Requests</code> response.
                Wait for the cooldown period before retrying.
              </p>
            </div>
          </div>
        </div>

        {/* Error Codes */}
        <div id="error-codes" data-section className="mb-8 scroll-mt-6">
          <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white text-lg">Error Codes</h2>
            </div>
            <div className="p-6">
              <div className="bg-dark-900 rounded-xl overflow-hidden border border-white/5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left font-medium text-dark-400 text-xs px-4 py-2.5">Code</th>
                      <th className="text-left font-medium text-dark-400 text-xs px-4 py-2.5">Status</th>
                      <th className="text-left font-medium text-dark-400 text-xs px-4 py-2.5 hidden sm:table-cell">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorCodes.map((err) => (
                      <tr key={err.code} className="border-b border-white/5 last:border-b-0">
                        <td className={`px-4 py-2.5 font-mono font-bold text-xs ${err.color}`}>{err.code}</td>
                        <td className="px-4 py-2.5 text-dark-100 text-xs">{err.label}</td>
                        <td className="px-4 py-2.5 text-dark-400 text-xs hidden sm:table-cell">{err.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Error Response Format */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Error Response Format</h4>
                <pre className="bg-dark-900 rounded-xl p-4 text-xs text-red-300 font-mono overflow-x-auto border border-white/5 leading-relaxed">{`{
  "statusCode": 401,
  "message": "Invalid or expired API key",
  "error": "Unauthorized"
}`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-primary-500/10 to-primary-600/5 border border-primary-500/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white mb-1">Ready to start building?</h3>
              <p className="text-sm text-dark-300">Create an API key and start making requests in seconds.</p>
            </div>
            <Link
              href="/dashboard/api-keys"
              className="shrink-0 bg-primary-500 hover:bg-primary-400 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              Get API Key
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
