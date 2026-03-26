'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const analysisTypes = [
  { value: 'optimize', label: 'Optimize Post', desc: 'Improve an existing post for maximum engagement', icon: '🚀' },
  { value: 'score', label: 'Viral Score', desc: 'Rate your content\'s viral potential (1-100)', icon: '📊' },
  { value: 'timing', label: 'Best Time to Post', desc: 'Get the optimal posting schedule', icon: '⏰' },
  { value: 'strategy', label: 'Growth Strategy', desc: 'Personalized growth plan for your niche', icon: '📈' },
  { value: 'hashtags', label: 'Hashtag Strategy', desc: 'Optimize your hashtag game', icon: '#️⃣' },
  { value: 'competitor', label: 'Competitor Analysis', desc: 'Analyze what\'s working in your niche', icon: '🔍' },
];

const platforms = [
  { value: 'twitter', label: 'Twitter / X', icon: '𝕏' },
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'in' },
  { value: 'tiktok', label: 'TikTok', icon: '♪' },
  { value: 'youtube', label: 'YouTube', icon: '▶' },
  { value: 'threads', label: 'Threads', icon: '@' },
];

export default function ViralCoachPage() {
  const [analysisType, setAnalysisType] = useState('optimize');
  const [platform, setPlatform] = useState('twitter');
  const [input, setInput] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  const getPrompt = () => {
    switch (analysisType) {
      case 'optimize':
        return `You are a viral content expert. Analyze this ${platform} post and provide an optimized version:

Original post: "${input}"

Provide:
1. VIRAL SCORE: Rate the original (1-100) with explanation
2. OPTIMIZED VERSION: Rewrite for maximum engagement
3. HOOK IMPROVEMENT: Better opening line
4. CTA: Add a strong call to action
5. HASHTAGS: 8-12 optimized hashtags
6. WHY IT WORKS: Explain the psychology behind your changes
7. ADDITIONAL TIPS: 3 specific tips for this content`;

      case 'score':
        return `You are a viral content analyst. Score this ${platform} post's viral potential:

Post: "${input}"

Provide:
1. OVERALL VIRAL SCORE: X/100
2. HOOK SCORE: X/10 (first line strength)
3. ENGAGEMENT SCORE: X/10 (will people interact?)
4. SHAREABILITY: X/10 (will people share?)
5. EMOTION SCORE: X/10 (emotional impact)
6. CTA SCORE: X/10 (call to action effectiveness)
7. DETAILED FEEDBACK: What works, what doesn't
8. TOP 3 IMPROVEMENTS: Specific changes to boost virality`;

      case 'timing':
        return `You are a social media timing expert. Provide the optimal posting schedule for ${platform}.
${niche ? `Niche: ${niche}` : ''}
${input ? `Context: ${input}` : ''}

Provide:
1. BEST DAYS: Top 3 days of the week
2. BEST TIMES: Top 3 time slots (with timezone note)
3. WORST TIMES: Times to avoid
4. POSTING FREQUENCY: Ideal posts per week
5. CONTENT MIX: What % should be each type
6. WEEKLY SCHEDULE: A complete 7-day content plan
7. SEASONAL TIPS: Current trends to leverage`;

      case 'strategy':
        return `You are a social media growth strategist. Create a growth plan for ${platform}.
Niche: ${niche || input || 'general'}

Provide:
1. 30-DAY GROWTH PLAN with weekly milestones
2. CONTENT PILLARS: 4-5 content themes to rotate
3. ENGAGEMENT STRATEGY: How to build community
4. COLLABORATION IDEAS: Types of creators to partner with
5. VIRAL FORMATS: Content formats trending right now
6. MONETIZATION PATH: When and how to monetize
7. KEY METRICS: What to track and target numbers
8. COMMON MISTAKES: Top 5 mistakes to avoid`;

      case 'hashtags':
        return `You are a hashtag strategy expert for ${platform}.
${niche ? `Niche: ${niche}` : ''}
${input ? `Content topic: ${input}` : ''}

Provide:
1. HIGH-VOLUME HASHTAGS (5): 500K+ posts, broad reach
2. MEDIUM HASHTAGS (5): 50K-500K posts, good balance
3. NICHE HASHTAGS (5): Under 50K, targeted audience
4. BRANDED HASHTAGS (3): Unique to build community
5. TRENDING NOW (5): Currently trending relevant tags
6. HASHTAG STRATEGY: How to mix and rotate them
7. DO'S AND DON'TS: Common hashtag mistakes`;

      case 'competitor':
        return `You are a competitive analysis expert for ${platform}.
Niche: ${niche || input || 'general'}

Provide:
1. TOP PERFORMING CONTENT TYPES in this niche
2. VIRAL PATTERNS: Common elements in viral posts
3. ENGAGEMENT TRIGGERS: What drives comments/shares
4. CONTENT GAPS: Untapped content opportunities
5. POSTING PATTERNS: When competitors post
6. GROWTH TACTICS: What fast-growing accounts do differently
7. DIFFERENTIATION: How to stand out in this niche
8. ACTION ITEMS: 5 things to implement this week`;

      default:
        return input;
    }
  };

  const handleAnalyze = async () => {
    if (!input.trim() && !niche.trim()) {
      setError('Please provide content to analyze or describe your niche');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.post<any>('/ai/generate', {
        prompt: getPrompt(),
        type: 'full_post',
        platform,
      });
      setResult(data);
      setHistory((prev) => [{ type: analysisType, platform, input: input || niche, result: data, date: new Date().toISOString() }, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Viral AI Coach</h1>
            <p className="text-sm text-dark-300">AI-powered content optimization and growth strategies</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-5">{error}</div>
      )}

      {/* Analysis Type Selection */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {analysisTypes.map((t) => (
          <button
            key={t.value}
            onClick={() => setAnalysisType(t.value)}
            className={`text-left p-4 rounded-2xl transition-all border ${
              analysisType === t.value
                ? 'bg-gradient-to-br from-primary-500/10 to-accent-500/5 border-primary-500/30'
                : 'bg-dark-800 border-white/5 hover:border-white/10'
            }`}
          >
            <span className="text-2xl">{t.icon}</span>
            <h3 className={`text-sm font-semibold mt-2 ${analysisType === t.value ? 'text-primary-400' : 'text-white'}`}>{t.label}</h3>
            <p className="text-[11px] text-dark-400 mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Input */}
        <div className="lg:col-span-2 space-y-4">
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

          {(analysisType === 'timing' || analysisType === 'strategy' || analysisType === 'hashtags' || analysisType === 'competitor') && (
            <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
              <label className="block text-sm font-medium text-white mb-2">Your Niche</label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., fitness, SaaS, cooking, fashion..."
                className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          )}

          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <label className="block text-sm font-medium text-white mb-2">
              {analysisType === 'optimize' || analysisType === 'score' ? 'Paste your post' : 'Additional context (optional)'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                analysisType === 'optimize' ? 'Paste the post you want to optimize...' :
                analysisType === 'score' ? 'Paste the post you want scored...' :
                'Any additional context about your content or goals...'
              }
              className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px] resize-y text-sm"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
                Analyze with AI Coach
              </>
            )}
          </button>
        </div>

        {/* Result */}
        <div className="lg:col-span-3">
          {result ? (
            <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{analysisTypes.find((t) => t.value === analysisType)?.icon}</span>
                  <h3 className="font-semibold text-white">{analysisTypes.find((t) => t.value === analysisType)?.label}</h3>
                </div>
                <button onClick={() => navigator.clipboard.writeText(result.content)} className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors">
                  Copy
                </button>
              </div>
              <div className="p-5">
                <pre className="text-sm text-dark-200 whitespace-pre-wrap font-sans leading-relaxed">{result.content}</pre>
              </div>
            </div>
          ) : !loading ? (
            <div className="bg-dark-800 border border-white/5 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Your AI Coach is Ready</h3>
              <p className="text-sm text-dark-300">Select an analysis type, choose your platform, and get personalized advice.</p>
            </div>
          ) : null}

          {/* History */}
          {history.length > 0 && (
            <div className="mt-4 bg-dark-800 border border-white/5 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Recent Analyses</h3>
              <div className="space-y-2">
                {history.slice(0, 5).map((h, i) => (
                  <button
                    key={i}
                    onClick={() => { setResult(h.result); setAnalysisType(h.type); }}
                    className="w-full text-left p-3 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{analysisTypes.find((t) => t.value === h.type)?.icon}</span>
                      <span className="text-xs font-medium text-white">{analysisTypes.find((t) => t.value === h.type)?.label}</span>
                      <span className="text-[10px] text-dark-400 ml-auto">{new Date(h.date).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-dark-400 mt-1 truncate">{h.input}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
