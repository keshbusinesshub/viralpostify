'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const hookTypes = [
  { value: 'question', label: 'Question Hook', desc: 'Start with an intriguing question', icon: '❓', example: '"Did you know 90% of startups fail because of this ONE mistake?"' },
  { value: 'statistic', label: 'Statistic Hook', desc: 'Lead with a surprising number', icon: '📊', example: '"I made $47,000 in 30 days using this simple strategy"' },
  { value: 'controversy', label: 'Controversial Hook', desc: 'Challenge common beliefs', icon: '🔥', example: '"Stop posting motivational quotes. Here\'s what actually works"' },
  { value: 'story', label: 'Story Hook', desc: 'Open with a mini story', icon: '📖', example: '"Last year I was broke. Today I run a 7-figure business. Here\'s what changed"' },
  { value: 'promise', label: 'Promise Hook', desc: 'Promise a specific outcome', icon: '🎯', example: '"Read this and you\'ll never struggle with content ideas again"' },
  { value: 'fear', label: 'Fear of Missing Out', desc: 'Create urgency and FOMO', icon: '⚡', example: '"Everyone is doing this and you\'re falling behind"' },
  { value: 'relatable', label: 'Relatable Hook', desc: 'Connect through shared experience', icon: '🤝', example: '"POV: You\'ve been scrolling for 2 hours instead of working"' },
  { value: 'list', label: 'List Hook', desc: 'Numbered lists that promise value', icon: '📝', example: '"5 tools that saved me 10 hours per week (all free)"' },
];

const niches = [
  'Business & Entrepreneurship', 'Marketing & Sales', 'Personal Finance',
  'Tech & AI', 'Health & Fitness', 'Personal Development',
  'Lifestyle & Travel', 'Food & Cooking', 'Fashion & Beauty',
  'Education', 'Real Estate', 'Freelancing',
];

export default function HooksPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['question', 'controversy']);
  const [topic, setTopic] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hooks, setHooks] = useState<{ text: string; type: string }[]>([]);
  const [error, setError] = useState('');
  const [savedHooks, setSavedHooks] = useState<string[]>([]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim() && !selectedNiche) {
      setError('Enter a topic or select a niche');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const typeNames = selectedTypes.map((t) => hookTypes.find((h) => h.value === t)?.label).join(', ');
      const data = await api.post<any>('/ai/generate', {
        prompt: `You are a viral content hook expert. Generate ${count} powerful opening lines/hooks for ${platform}.

Topic/Niche: ${topic || selectedNiche}
Hook Types to include: ${typeNames || 'Mix of all types'}

Requirements:
- Each hook MUST stop the scroll
- Use pattern interrupts and curiosity gaps
- Each hook should be 1-2 lines max
- Include a mix of the requested hook types
- Label each hook with its type in brackets

Format: Number each hook 1-${count}. Put the hook type in [brackets] before each one.

Example format:
1. [Question] Did you know that...
2. [Controversial] Stop doing X...`,
        type: 'full_post',
        platform,
      });

      // Parse hooks from response
      const lines = data.content.split('\n').filter((l: string) => l.trim() && /^\d/.test(l.trim()));
      const parsed = lines.map((line: string) => {
        const typeMatch = line.match(/\[([^\]]+)\]/);
        return {
          text: line.replace(/^\d+\.\s*/, '').replace(/\[[^\]]+\]\s*/, '').trim(),
          type: typeMatch ? typeMatch[1] : 'General',
        };
      });
      setHooks(parsed.length > 0 ? parsed : [{ text: data.content, type: 'Mixed' }]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate hooks');
    }
    setLoading(false);
  };

  const toggleSave = (text: string) => {
    setSavedHooks((prev) =>
      prev.includes(text) ? prev.filter((h) => h !== text) : [...prev, text]
    );
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Viral Hooks Generator</h1>
            <p className="text-sm text-dark-300">Generate scroll-stopping opening lines for your content</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-5">{error}</div>
      )}

      {/* Hook Types */}
      <div className="bg-dark-800 border border-white/5 rounded-2xl p-5 mb-5">
        <h3 className="text-sm font-medium text-white mb-3">Hook Types</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {hookTypes.map((h) => (
            <button
              key={h.value}
              onClick={() => toggleType(h.value)}
              className={`text-left p-3 rounded-xl transition-all border ${
                selectedTypes.includes(h.value)
                  ? 'bg-primary-500/10 border-primary-500/30'
                  : 'bg-dark-700 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{h.icon}</span>
                <span className={`text-xs font-medium ${selectedTypes.includes(h.value) ? 'text-primary-400' : 'text-white'}`}>{h.label}</span>
              </div>
              <p className="text-[10px] text-dark-400 italic truncate">{h.example}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Topic */}
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <label className="block text-sm font-medium text-white mb-2">Topic or Idea</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., How to grow on LinkedIn, Best morning routine, AI tools for productivity..."
              className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px] resize-y text-sm"
            />
          </div>

          {/* Niche */}
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-3">Or pick a niche</h3>
            <div className="flex flex-wrap gap-1.5">
              {niches.map((n) => (
                <button
                  key={n}
                  onClick={() => setSelectedNiche(selectedNiche === n ? '' : n)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    selectedNiche === n
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'bg-dark-700 text-dark-300 border border-white/5 hover:text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Platform + Count */}
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Platform</h3>
              <select
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="bg-dark-700 border border-white/10 rounded-lg text-xs text-white px-2 py-1 focus:outline-none"
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>{n} hooks</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'twitter', label: '𝕏 Twitter' },
                { value: 'instagram', label: '📸 Instagram' },
                { value: 'linkedin', label: 'in LinkedIn' },
                { value: 'tiktok', label: '♪ TikTok' },
                { value: 'youtube', label: '▶ YouTube' },
                { value: 'threads', label: '@ Threads' },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    platform === p.value
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'bg-dark-700 text-dark-200 border border-white/5'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-dark-900 font-bold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                Generating hooks...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Generate {count} Hooks
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {hooks.length > 0 ? (
            <div className="space-y-2">
              {hooks.map((hook, i) => (
                <div key={i} className="bg-dark-800 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-[10px] font-medium text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">{hook.type}</span>
                      <p className="text-sm text-white mt-2 leading-relaxed">{hook.text}</p>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigator.clipboard.writeText(hook.text)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
                        title="Copy"
                      >
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      </button>
                      <button
                        onClick={() => toggleSave(hook.text)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          savedHooks.includes(hook.text)
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-white/10 hover:bg-white/15 text-white'
                        }`}
                        title="Save"
                      >
                        <svg className="w-3.5 h-3.5" fill={savedHooks.includes(hook.text) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="bg-dark-800 border border-white/5 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Stop the Scroll</h3>
              <p className="text-sm text-dark-300">Generate attention-grabbing hooks that make people stop scrolling and engage with your content.</p>
            </div>
          ) : null}

          {/* Saved Hooks */}
          {savedHooks.length > 0 && (
            <div className="mt-4 bg-dark-800 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Saved Hooks</h3>
                <span className="text-xs text-amber-400">{savedHooks.length} saved</span>
              </div>
              <div className="space-y-2">
                {savedHooks.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-dark-700 rounded-xl">
                    <p className="text-xs text-dark-200 flex-1 truncate mr-3">{h}</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => navigator.clipboard.writeText(h)} className="text-[10px] text-primary-400 hover:text-primary-300 font-medium">Copy</button>
                      <button onClick={() => toggleSave(h)} className="text-[10px] text-red-400 hover:text-red-300 font-medium">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
