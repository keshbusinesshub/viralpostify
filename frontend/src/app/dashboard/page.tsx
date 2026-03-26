'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, scheduled: 0, posted: 0, failed: 0 });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    api.get<any>('/posts?limit=5').then((data) => {
      const posts = data.posts || [];
      setRecentPosts(posts);
      setStats({
        total: data.total || 0,
        scheduled: posts.filter((p: any) => p.status === 'SCHEDULED').length,
        posted: posts.filter((p: any) => p.status === 'POSTED').length,
        failed: posts.filter((p: any) => p.status === 'FAILED').length,
      });
    }).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Total Posts', value: stats.total, icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', color: 'from-primary-500/20 to-primary-500/5', iconColor: 'text-primary-400' },
    { label: 'Scheduled', value: stats.scheduled, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400' },
    { label: 'Published', value: stats.posted, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400' },
    { label: 'Failed', value: stats.failed, icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-red-500/20 to-red-500/5', iconColor: 'text-red-400' },
  ];

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-dark-500 text-dark-100',
    SCHEDULED: 'bg-amber-500/15 text-amber-400',
    POSTED: 'bg-emerald-500/15 text-emerald-400',
    FAILED: 'bg-red-500/15 text-red-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name}</h1>
          <p className="text-dark-200 text-sm mt-1">Here&apos;s what&apos;s happening with your content</p>
        </div>
        <Link href="/dashboard/posts/create" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create Post
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border border-white/5 rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-dark-200">{stat.label}</span>
              <svg className={`w-5 h-5 ${stat.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={stat.icon} />
              </svg>
            </div>
            <p className="text-3xl font-extrabold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { href: '/dashboard/posts/create', label: 'Create with AI', desc: 'Generate viral content', gradient: 'from-violet-500/10 to-purple-500/5', icon: '✨' },
          { href: '/dashboard/posts/scheduled', label: 'View Schedule', desc: 'Manage upcoming posts', gradient: 'from-blue-500/10 to-cyan-500/5', icon: '📅' },
          { href: '/dashboard/accounts', label: 'Connect Account', desc: 'Add a social platform', gradient: 'from-pink-500/10 to-rose-500/5', icon: '🔗' },
        ].map((action) => (
          <Link key={action.href} href={action.href} className={`bg-gradient-to-br ${action.gradient} border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group`}>
            <span className="text-2xl mb-3 block">{action.icon}</span>
            <h3 className="text-white font-semibold group-hover:text-primary-400 transition-colors">{action.label}</h3>
            <p className="text-dark-300 text-sm mt-1">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent posts */}
      <div className="bg-dark-800 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Recent Posts</h2>
          <Link href="/dashboard/posts" className="text-sm text-primary-400 hover:text-primary-300">View all</Link>
        </div>
        {recentPosts.length === 0 ? (
          <p className="text-dark-300 text-sm py-4 text-center">No posts yet. Create your first post!</p>
        ) : (
          <div className="space-y-2">
            {recentPosts.map((post: any) => (
              <div key={post.id} className="flex items-center gap-4 p-3 rounded-xl bg-dark-700/50 hover:bg-dark-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{post.content}</p>
                  <p className="text-xs text-dark-300 mt-1 capitalize">{post.platform}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[post.status] || ''}`}>
                  {post.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
