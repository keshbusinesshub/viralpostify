'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const categories = [
  { value: 'trending', label: 'Trending', icon: '🔥' },
  { value: 'motivational', label: 'Motivational', icon: '💪' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'tech', label: 'Tech', icon: '💻' },
  { value: 'lifestyle', label: 'Lifestyle', icon: '🌿' },
  { value: 'fitness', label: 'Fitness', icon: '🏋️' },
  { value: 'food', label: 'Food', icon: '🍕' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'fashion', label: 'Fashion', icon: '👗' },
  { value: 'education', label: 'Education', icon: '📚' },
];

const platformFilters = [
  { value: 'all', label: 'All Platforms' },
  { value: 'twitter', label: '𝕏 Twitter' },
  { value: 'instagram', label: '📸 Instagram' },
  { value: 'linkedin', label: 'in LinkedIn' },
  { value: 'tiktok', label: '♪ TikTok' },
  { value: 'youtube', label: '▶ YouTube' },
  { value: 'threads', label: '@ Threads' },
];

export default function InspirationPage() {
  const [category, setCategory] = useState('trending');
  const [platform, setPlatform] = useState('all');
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedIdeas, setSavedIdeas] = useState<any[]>([]);

  const generateIdeas = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.post<any>('/ai/generate', {
        prompt: `Generate 8 unique, engaging social media post ideas for the "${category}" niche${platform !== 'all' ? ` optimized for ${platform}` : ''}.

For each idea, provide:
1. A catchy title/hook (1 line)
2. The full post content (2-4 sentences)
3. Suggested hashtags (5-8)
4. Best platform to post on
5. Estimated engagement level (High/Medium/Low)

Format each idea clearly separated with "---" between them. Make them diverse in format: some questions, some lists, some stories, some tips.`,
        type: 'full_post',
        platform: platform !== 'all' ? platform : undefined,
      });

      // Parse the ideas from AI response
      const rawIdeas = data.content.split('---').filter((s: string) => s.trim());
      const parsed = rawIdeas.map((idea: string, i: number) => ({
        id: Date.now() + i,
        content: idea.trim(),
        category,
        platform: platform !== 'all' ? platform : ['twitter', 'instagram', 'linkedin', 'tiktok'][i % 4],
        saved: false,
      }));
      setIdeas(parsed);
    } catch (err: any) {
      setError(err.message || 'Failed to generate ideas');
    }
    setLoading(false);
  };

  const saveIdea = (idea: any) => {
    setSavedIdeas((prev) => {
      if (prev.find((i) => i.id === idea.id)) return prev;
      return [{ ...idea, savedAt: new Date().toISOString() }, ...prev];
    });
  };

  const useIdea = (content: string) => {
    // Extract just the main content for creating a post
    const lines = content.split('\n').filter((l: string) => l.trim());
    const mainContent = lines.slice(0, 3).join('\n');
    sessionStorage.setItem('draft_content', mainContent);
    window.location.href = '/dashboard/posts/create';
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Inspiration</h1>
        <p className="text-sm text-dark-300 mt-1">Discover trending content ideas and never run out of things to post</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-5">{error}</div>
      )}

      {/* Categories */}
      <div className="bg-dark-800 border border-white/5 rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Choose a niche</h3>
          <div className="flex gap-1">
            {platformFilters.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                  platform === p.value
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-dark-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                category === c.value
                  ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/15 text-white border border-primary-500/30'
                  : 'bg-dark-700 text-dark-200 border border-white/5 hover:border-white/10'
              }`}
            >
              <span>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>
        <button
          onClick={generateIdeas}
          disabled={loading}
          className="mt-4 w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Discovering ideas...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              Generate Ideas
            </>
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Ideas Grid */}
        <div className="lg:col-span-2">
          {ideas.length === 0 && !loading ? (
            <div className="bg-dark-800 border border-white/5 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Get Inspired</h3>
              <p className="text-sm text-dark-300 mb-4">Select a niche and platform, then generate fresh content ideas tailored for your audience.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.map((idea) => (
                <div key={idea.id} className="bg-dark-800 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                  <pre className="text-sm text-dark-200 whitespace-pre-wrap font-sans leading-relaxed mb-4">{idea.content}</pre>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => useIdea(idea.content)}
                        className="px-3 py-1.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Use This
                      </button>
                      <button
                        onClick={() => saveIdea(idea)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          savedIdeas.find((i) => i.id === idea.id)
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-white/10 hover:bg-white/15 text-white'
                        }`}
                      >
                        {savedIdeas.find((i) => i.id === idea.id) ? 'Saved' : 'Save'}
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(idea.content)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Ideas */}
        <div>
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5 sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Saved Ideas</h3>
              <span className="text-xs text-dark-400">{savedIdeas.length}</span>
            </div>
            {savedIdeas.length === 0 ? (
              <p className="text-xs text-dark-400 text-center py-6">Click &quot;Save&quot; on ideas you like to keep them here.</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {savedIdeas.map((idea) => (
                  <div key={idea.id} className="p-3 bg-dark-700 rounded-xl">
                    <p className="text-xs text-dark-200 line-clamp-3">{idea.content.slice(0, 120)}...</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => useIdea(idea.content)}
                        className="text-[10px] text-primary-400 hover:text-primary-300 font-medium"
                      >
                        Use
                      </button>
                      <span className="text-dark-500">|</span>
                      <button
                        onClick={() => setSavedIdeas((prev) => prev.filter((i) => i.id !== idea.id))}
                        className="text-[10px] text-red-400 hover:text-red-300 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
