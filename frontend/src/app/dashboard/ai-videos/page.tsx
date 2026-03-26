'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const videoTypes = [
  { value: 'short_form', label: 'Short Form', desc: 'TikTok, Reels, Shorts (15-60s)', icon: '⚡' },
  { value: 'long_form', label: 'Long Form', desc: 'YouTube videos (3-10min)', icon: '🎬' },
  { value: 'story', label: 'Story Script', desc: 'Stories & Fleets (15s)', icon: '📱' },
  { value: 'ad', label: 'Ad Script', desc: 'Promotional videos (30-60s)', icon: '📢' },
];

const platforms = [
  { value: 'tiktok', label: 'TikTok', icon: '♪' },
  { value: 'instagram', label: 'Instagram Reels', icon: '📸' },
  { value: 'youtube', label: 'YouTube Shorts', icon: '▶' },
  { value: 'facebook', label: 'Facebook Reels', icon: 'f' },
  { value: 'linkedin', label: 'LinkedIn Video', icon: 'in' },
];

const tones = [
  { value: 'funny', label: 'Funny', icon: '😂' },
  { value: 'educational', label: 'Educational', icon: '📚' },
  { value: 'inspirational', label: 'Inspirational', icon: '🌟' },
  { value: 'storytelling', label: 'Storytelling', icon: '📖' },
  { value: 'controversial', label: 'Controversial', icon: '🔥' },
  { value: 'tutorial', label: 'Tutorial', icon: '🎯' },
];

const templates = [
  { label: 'Day in My Life', prompt: 'Create a "day in my life" video script for a content creator showing morning routine, work, and evening wind-down' },
  { label: 'Product Review', prompt: 'Write a product review video script that hooks viewers in 3 seconds and provides honest pros/cons' },
  { label: 'How-To Tutorial', prompt: 'Create a step-by-step tutorial video script that teaches something valuable in under 60 seconds' },
  { label: 'Before/After', prompt: 'Write a before and after transformation video script with a shocking reveal' },
  { label: 'Top 5 List', prompt: 'Create a Top 5 list video script with rapid-fire delivery and engaging transitions' },
  { label: 'Storytime', prompt: 'Write an engaging storytime video script that keeps viewers watching until the end' },
];

export default function AIVideosPage() {
  const [prompt, setPrompt] = useState('');
  const [videoType, setVideoType] = useState('short_form');
  const [platform, setPlatform] = useState('tiktok');
  const [tone, setTone] = useState('funny');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [savedScripts, setSavedScripts] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError('Enter a topic or idea for your video'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await api.post<any>('/ai/generate', {
        prompt: `Create a ${videoType === 'short_form' ? 'short-form (15-60 second)' : videoType === 'long_form' ? 'long-form (3-10 minute)' : videoType === 'story' ? '15-second story' : '30-60 second ad'} video script for ${platform}.

Topic: ${prompt}

Tone: ${tone}

Format the script with:
1. HOOK (first 3 seconds - attention grabber)
2. SETUP (context/problem)
3. MAIN CONTENT (value/story/information)
4. CTA (call to action)

Include:
- Visual directions in [brackets]
- Suggested text overlays in {curly braces}
- Timing for each section
- Music/sound suggestions`,
        type: 'full_post',
        platform,
        tone,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate video script');
    }
    setLoading(false);
  };

  const saveScript = () => {
    if (result) {
      setSavedScripts((prev) => [{ ...result, prompt, videoType, platform, tone, date: new Date().toISOString() }, ...prev]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Video Scripts</h1>
        <p className="text-sm text-dark-300 mt-1">Generate engaging video scripts for all platforms</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-5">{error}</div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Type */}
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-3">Video Type</h3>
            <div className="space-y-2">
              {videoTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setVideoType(t.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    videoType === t.value
                      ? 'bg-primary-500/15 border border-primary-500/30'
                      : 'bg-dark-700 border border-white/5 hover:border-white/10'
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${videoType === t.value ? 'text-primary-400' : 'text-white'}`}>{t.label}</p>
                    <p className="text-[10px] text-dark-400">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-3">Platform</h3>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    platform === p.value
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'bg-dark-700 text-dark-200 border border-white/5 hover:border-white/10'
                  }`}
                >
                  <span>{p.icon}</span> {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-3">Tone</h3>
            <div className="grid grid-cols-2 gap-2">
              {tones.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    tone === t.value
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'bg-dark-700 text-dark-200 border border-white/5 hover:border-white/10'
                  }`}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-3">Quick Templates</h3>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setPrompt(t.prompt)}
                  className="text-left px-3 py-2 bg-dark-700 hover:bg-dark-600 border border-white/5 rounded-xl text-xs text-dark-200 hover:text-white transition-all"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Prompt + Result */}
        <div className="lg:col-span-3 space-y-4">
          {/* Prompt */}
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <label className="block text-sm font-medium text-white mb-2">What&apos;s your video about?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., How to make money online as a student, My morning routine as a developer, 5 productivity hacks..."
              className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-y text-sm"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="mt-3 w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Script...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Generate Video Script
                </>
              )}
            </button>
          </div>

          {/* Result */}
          {result ? (
            <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-white">Generated Script</h3>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(result.content)} className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors">
                    Copy
                  </button>
                  <button onClick={saveScript} className="px-3 py-1.5 bg-primary-500/15 text-primary-400 text-xs font-medium rounded-lg hover:bg-primary-500/25 transition-colors">
                    Save
                  </button>
                </div>
              </div>
              <div className="p-5">
                <pre className="text-sm text-dark-200 whitespace-pre-wrap font-sans leading-relaxed">{result.content}</pre>
              </div>
            </div>
          ) : !loading ? (
            <div className="bg-dark-800 border border-white/5 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Create Your Video Script</h3>
              <p className="text-sm text-dark-300">Pick a type, platform, and tone — then describe your idea.</p>
            </div>
          ) : null}

          {/* Saved Scripts */}
          {savedScripts.length > 0 && (
            <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Saved Scripts ({savedScripts.length})</h3>
              <div className="space-y-2">
                {savedScripts.map((s, i) => (
                  <div key={i} className="p-3 bg-dark-700 rounded-xl cursor-pointer hover:bg-dark-600 transition-colors" onClick={() => setResult(s)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium text-primary-400 bg-primary-500/15 px-1.5 py-0.5 rounded">{s.videoType}</span>
                      <span className="text-[10px] text-dark-400">{s.platform}</span>
                      <span className="text-[10px] text-dark-400 ml-auto">{new Date(s.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-dark-200 truncate">{s.prompt}</p>
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
