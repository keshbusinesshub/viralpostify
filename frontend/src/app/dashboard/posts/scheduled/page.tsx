'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ScheduledPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any[]>('/posts/scheduled')
      .then((data) => setPosts(data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Scheduled Posts</h1>
      {loading ? (
        <div className="text-center py-12 text-dark-300">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="bg-dark-800 border border-white/5 rounded-2xl text-center py-16">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-dark-300">No scheduled posts yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id} className="bg-dark-800 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
              <p className="text-sm text-white mb-3">{post.content}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-primary-400 bg-primary-500/15 px-2.5 py-1 rounded-full capitalize">{post.platform}</span>
                <span className="text-xs text-dark-300">{new Date(post.scheduledTime).toLocaleString()}</span>
                <span className="text-xs font-medium bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full">Scheduled</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
