'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const data = await api.get<any>(`/posts${params}`);
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {}
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-dark-500 text-dark-100',
    SCHEDULED: 'bg-amber-500/15 text-amber-400',
    POSTED: 'bg-emerald-500/15 text-emerald-400',
    FAILED: 'bg-red-500/15 text-red-400',
  };

  const filters = ['', 'DRAFT', 'SCHEDULED', 'POSTED', 'FAILED'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Posts</h1>
        <Link href="/dashboard/posts/create" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create Post
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {filters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === s ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-dark-700 text-dark-200 border border-white/5 hover:border-white/10'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-dark-300">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="bg-dark-800 border border-white/5 rounded-2xl text-center py-12">
          <p className="text-dark-300 mb-4">No posts found</p>
          <Link href="/dashboard/posts/create" className="text-primary-400 hover:text-primary-300 text-sm font-medium">Create your first post</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id} className="bg-dark-800 border border-white/5 rounded-2xl p-5 flex items-start gap-4 hover:border-white/10 transition-all">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{post.content}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-dark-300 capitalize">{post.platform}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[post.status] || ''}`}>{post.status}</span>
                  {post.scheduledTime && (
                    <span className="text-xs text-dark-400">Scheduled: {new Date(post.scheduledTime).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(post.id)} className="text-dark-400 hover:text-red-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
