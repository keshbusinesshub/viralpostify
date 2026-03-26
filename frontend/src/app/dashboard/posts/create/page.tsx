'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function CreatePostPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (type: string) => {
    if (!content.trim()) { setError('Enter a topic or prompt first'); return; }
    setAiLoading(true);
    setError('');
    try {
      const data = await api.post<{ content: string }>('/ai/generate', { prompt: content, type, platform });
      setContent(data.content);
    } catch (err: any) { setError(err.message); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (asDraft: boolean) => {
    setLoading(true);
    setError('');
    try {
      if (scheduledTime && !asDraft) {
        await api.post('/posts/schedule', { content, mediaUrl: mediaUrl || undefined, platform, scheduledTime });
      } else {
        await api.post('/posts', { content, mediaUrl: mediaUrl || undefined, platform, status: asDraft ? 'DRAFT' : undefined });
      }
      router.push('/dashboard/posts');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const platforms = [
    { value: 'twitter', label: 'Twitter / X', icon: '𝕏' },
    { value: 'instagram', label: 'Instagram', icon: '📸' },
    { value: 'facebook', label: 'Facebook', icon: 'f' },
    { value: 'linkedin', label: 'LinkedIn', icon: 'in' },
    { value: 'tiktok', label: 'TikTok', icon: '♪' },
    { value: 'youtube', label: 'YouTube', icon: '▶' },
    { value: 'threads', label: 'Threads', icon: '@' },
    { value: 'bluesky', label: 'Bluesky', icon: '🦋' },
    { value: 'pinterest', label: 'Pinterest', icon: '📌' },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-6">Create Post</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-5">{error}</div>
      )}

      {/* AI Generator Card */}
      <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-white/5 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">✨</span>
          <h2 className="text-lg font-bold text-white">AI Content Generator</h2>
        </div>
        <p className="text-dark-300 text-sm mb-4">Write a topic or idea below, then click generate. The AI will create platform-optimized content for you.</p>
        <div className="flex gap-2">
          {[
            { type: 'caption', label: 'Caption' },
            { type: 'hashtags', label: 'Hashtags' },
            { type: 'full_post', label: 'Full Post' },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => handleGenerate(item.type)}
              disabled={aiLoading}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {aiLoading ? '...' : `Generate ${item.label}`}
            </button>
          ))}
        </div>
      </div>

      {/* Post form */}
      <div className="bg-dark-800 border border-white/5 rounded-2xl p-6 space-y-5">
        {/* Platform selector */}
        <div>
          <label className="block text-sm font-medium text-dark-100 mb-2">Platform</label>
          <div className="flex gap-2 flex-wrap">
            {platforms.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  platform === p.value
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-700 text-dark-200 border border-white/5 hover:border-white/10'
                }`}
              >
                <span>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-dark-100 mb-2">Content</label>
          <textarea
            className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[180px] resize-y"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content or enter a topic for AI generation..."
          />
          <p className="text-xs text-dark-400 mt-1">{content.length} characters</p>
        </div>

        {/* Media URL */}
        <div>
          <label className="block text-sm font-medium text-dark-100 mb-2">Media URL <span className="text-dark-400">(optional)</span></label>
          <input
            type="url"
            className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-dark-100 mb-2">Schedule <span className="text-dark-400">(optional)</span></label>
          <input
            type="datetime-local"
            className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent [color-scheme:dark]"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading || !content.trim()}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Publishing...' : scheduledTime ? 'Schedule Post' : 'Post Now'}
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading || !content.trim()}
            className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-all disabled:opacity-50"
          >
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
}
