'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const styles = [
  { value: 'realistic', label: 'Realistic', icon: '📷' },
  { value: 'illustration', label: 'Illustration', icon: '🎨' },
  { value: 'cartoon', label: 'Cartoon', icon: '🖌️' },
  { value: '3d', label: '3D Render', icon: '🧊' },
  { value: 'watercolor', label: 'Watercolor', icon: '💧' },
  { value: 'minimalist', label: 'Minimalist', icon: '◻️' },
  { value: 'cinematic', label: 'Cinematic', icon: '🎬' },
  { value: 'anime', label: 'Anime', icon: '✨' },
];

const sizes = [
  { value: '1024x1024', label: 'Square (1:1)', desc: 'Instagram, Facebook' },
  { value: '1792x1024', label: 'Landscape (16:9)', desc: 'YouTube, Twitter' },
  { value: '1024x1792', label: 'Portrait (9:16)', desc: 'Stories, Reels, TikTok' },
];

const templates = [
  { prompt: 'A modern flat lay product photo with minimal props on a clean white background', label: 'Product Shot' },
  { prompt: 'An inspiring motivational quote design with elegant typography on a gradient background', label: 'Quote Card' },
  { prompt: 'A professional business headshot-style photo in a modern office setting', label: 'Professional' },
  { prompt: 'A vibrant food photography shot with beautiful plating and natural lighting', label: 'Food Photo' },
  { prompt: 'A stunning landscape nature photo with golden hour lighting', label: 'Nature' },
  { prompt: 'A trendy social media story background with abstract shapes and gradients', label: 'Story BG' },
];

export default function AIImagesPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ prompt: string; style: string; url: string; date: string }[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError('Please enter a description for your image'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await api.post<any>('/ai/generate-image', {
        prompt: `${prompt}. Style: ${style}`,
        size,
        style,
      });
      if (data.url) {
        setImages((prev) => [data.url, ...prev]);
        setHistory((prev) => [{ prompt, style, url: data.url, date: new Date().toISOString() }, ...prev]);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate image. Make sure your OpenAI API key supports DALL-E.');
    }
    setLoading(false);
  };

  const applyTemplate = (t: typeof templates[0]) => {
    setPrompt(t.prompt);
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Image Generator</h1>
        <p className="text-sm text-dark-300 mt-1">Create stunning images for your social media posts with AI</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-5">{error}</div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-2 space-y-5">
          {/* Prompt */}
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <label className="block text-sm font-medium text-white mb-2">Describe your image</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A professional product photo of wireless headphones floating against a gradient purple background..."
              className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px] resize-y text-sm"
            />
          </div>

          {/* Quick Templates */}
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-3">Quick Templates</h3>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.label}
                  onClick={() => applyTemplate(t)}
                  className="text-left px-3 py-2 bg-dark-700 hover:bg-dark-600 border border-white/5 rounded-xl text-xs text-dark-200 hover:text-white transition-all"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-3">Style</h3>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    style === s.value
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'bg-dark-700 text-dark-200 border border-white/5 hover:border-white/10'
                  }`}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="bg-dark-800 border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-3">Size</h3>
            <div className="space-y-2">
              {sizes.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSize(s.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                    size === s.value
                      ? 'bg-primary-500/15 text-white border border-primary-500/30'
                      : 'bg-dark-700 text-dark-200 border border-white/5 hover:border-white/10'
                  }`}
                >
                  <span className="font-medium">{s.label}</span>
                  <span className="text-xs text-dark-400">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Generate Image
              </>
            )}
          </button>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-3">
          {images.length === 0 && !loading ? (
            <div className="bg-dark-800 border border-white/5 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No images yet</h3>
              <p className="text-sm text-dark-300">Describe what you want and click generate to create AI images for your posts.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {loading && (
                <div className="bg-dark-800 border border-white/5 rounded-2xl p-12 text-center">
                  <div className="w-12 h-12 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-dark-300">Generating your image...</p>
                  <p className="text-xs text-dark-400 mt-1">This may take 10-30 seconds</p>
                </div>
              )}
              {images.map((url, i) => (
                <div key={i} className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
                  <img src={url} alt={`Generated ${i + 1}`} className="w-full" />
                  <div className="p-4 flex items-center justify-between">
                    <p className="text-xs text-dark-400 truncate flex-1">{history[i]?.prompt || 'Generated image'}</p>
                    <div className="flex gap-2 ml-3">
                      <a href={url} download target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors">
                        Download
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(url);
                        }}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
