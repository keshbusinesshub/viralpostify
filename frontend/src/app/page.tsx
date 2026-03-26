'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ───────── Platform Logos (SVG inline) ───────── */
const platforms = [
  { name: 'Twitter / X', icon: '𝕏' },
  { name: 'Instagram', icon: '📸' },
  { name: 'LinkedIn', icon: 'in' },
  { name: 'Facebook', icon: 'f' },
  { name: 'TikTok', icon: '♪' },
  { name: 'YouTube', icon: '▶' },
  { name: 'Pinterest', icon: 'P' },
  { name: 'Threads', icon: '@' },
];

/* ───────── Features Data ───────── */
const features = [
  {
    title: 'Genius AI Writer',
    description:
      'AI trained on 1,000,000+ viral posts. Generate captions, hashtags, and full posts that actually perform — in any niche, any tone.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/10',
  },
  {
    title: 'Cross-Post Everywhere',
    description:
      'Post to Twitter, Instagram, LinkedIn, Facebook, TikTok, and more — all at once. Maximize reach without the manual grind.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'Visual Content Engine',
    description:
      'Turn any idea into carousels, infographics, and video clips using proven viral templates. No design skills needed.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    ),
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500/10',
  },
  {
    title: 'Smart Scheduler',
    description:
      'Schedule weeks of content in minutes. Our AI picks optimal posting times for maximum engagement on every platform.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    title: 'Pro Automation API',
    description:
      'Full social media API for insane automations. Plug into n8n, Make, or Zapier to build workflows that scale your brand 10x.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    title: 'Analytics & Insights',
    description:
      'Track every post, every platform. See what\'s working, double down on winners, and grow faster with data-driven decisions.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: 'from-sky-500 to-indigo-500',
    bgColor: 'bg-sky-500/10',
  },
];

/* ───────── Testimonials ───────── */
const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Founder, GlowBrand',
    text: 'Viralpostify replaced 4 different tools for us. We went from spending 3 hours daily on social media to 15 minutes. Our engagement is up 340%.',
    avatar: 'SC',
  },
  {
    name: 'Marcus Rivera',
    role: 'Marketing Director',
    text: 'The AI writer is genuinely scary good. It captures our brand voice perfectly and the viral templates actually work. Best investment this year.',
    avatar: 'MR',
  },
  {
    name: 'Priya Patel',
    role: 'Agency Owner',
    text: "Managing 40+ client accounts used to be a nightmare. Now my team of 3 handles it effortlessly with Viralpostify's automation workflows.",
    avatar: 'PP',
  },
  {
    name: 'James Okafor',
    role: 'Content Creator, 500K followers',
    text: "I've tried every scheduling tool out there. Viralpostify is the only one that actually helps me create better content, not just schedule it.",
    avatar: 'JO',
  },
  {
    name: 'Lisa Nakamura',
    role: 'E-commerce Brand Owner',
    text: 'From 2K to 85K followers in 4 months. The cross-posting + AI combo is absolutely unbeatable. My DMs are flooded with collab offers now.',
    avatar: 'LN',
  },
  {
    name: 'David Kim',
    role: 'SaaS Founder',
    text: 'The n8n integration is a game-changer. We built an entire content pipeline that runs on autopilot. Literally set it and forget it.',
    avatar: 'DK',
  },
];

/* ───────── Pricing ───────── */
const pricingPlans = [
  {
    name: 'Starter',
    price: 29,
    period: '/month',
    description: 'Perfect for solo creators getting started',
    features: [
      '1,250 AI credits / month',
      '5 social accounts',
      'AI content generation',
      'Post scheduling',
      'Basic analytics',
      'Cross-posting',
      'Email support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Creator',
    price: 97,
    period: '/month',
    description: 'For serious creators ready to scale',
    features: [
      '5,000 AI credits / month',
      '20 social accounts',
      'Everything in Starter',
      'Viral post templates',
      'Visual content engine',
      'Priority video processing',
      'Automation API access',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Agency',
    price: 499,
    period: '/month',
    description: 'For teams & agencies managing brands',
    features: [
      '28,000 AI credits / month',
      'Unlimited social accounts',
      'Everything in Creator',
      'Dedicated video processing',
      'White-label reports',
      'Team collaboration',
      'Dedicated support channel',
      'Custom integrations',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
];

/* ───────── FAQ ───────── */
const faqs = [
  {
    q: 'How does the free trial work?',
    a: 'You get 7 days of full access with 500 AI credits — no credit card required. If you love it, pick a plan. If not, no worries.',
  },
  {
    q: 'Which social platforms are supported?',
    a: 'Twitter/X, Instagram, Facebook, LinkedIn, TikTok, YouTube, Pinterest, Threads, and more being added monthly.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. Cancel with one click from your dashboard. No contracts, no hidden fees, no guilt trips.',
  },
  {
    q: 'How good is the AI content?',
    a: "Our AI is trained on over 1 million viral posts across all major platforms. It doesn't just write — it writes content engineered to perform.",
  },
  {
    q: 'Do you support automation tools like n8n or Zapier?',
    a: 'Yes! Our Pro Automation API integrates natively with n8n, Make, and Zapier. Build custom workflows that post, repurpose, and scale automatically.',
  },
  {
    q: 'Is my data secure?',
    a: 'We use enterprise-grade encryption, never store your social media passwords, and are fully GDPR compliant. Your data stays yours.',
  },
];

/* ─────────────────────────────────────── */
/* ─────────── MAIN COMPONENT ─────────── */
/* ─────────────────────────────────────── */
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-dark-900 text-white overflow-x-hidden">
      {/* ═══════ NAV ═══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-bold text-sm">
              V
            </div>
            <span className="text-lg font-bold">Viralpostify</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-dark-100 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-dark-100 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-dark-100 hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-dark-100 hover:text-white transition-colors px-3 py-2">
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white px-5 py-2 rounded-full transition-all"
            >
              Start FREE Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="gradient-hero relative pt-32 pb-24 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] animate-glow" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-accent-600/15 rounded-full blur-[100px] animate-glow" style={{ animationDelay: '2s' }} />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          {/* Social proof badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 animate-fade-in">
            <div className="flex -space-x-2">
              {['bg-violet-500', 'bg-pink-500', 'bg-blue-500', 'bg-emerald-500'].map((c, i) => (
                <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-dark-900 flex items-center justify-center text-[8px] font-bold`}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-sm text-dark-50">
              <span className="font-semibold text-white">10,000+</span> creators already growing
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6 animate-fade-in-up">
            Make 1 Week of Content
            <br />
            <span className="gradient-text">in 1 Minute</span>
          </h1>

          <p className="text-lg sm:text-xl text-dark-100 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            AI-powered content creation, scheduling, and cross-posting to every platform.
            Stop grinding. Start growing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white font-semibold text-lg px-8 py-4 rounded-full transition-all animate-pulse-soft"
            >
              Start FREE Week
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <span className="text-sm text-dark-200">No credit card required</span>
          </div>

          {/* Platform strip */}
          <div className="flex items-center justify-center gap-6 flex-wrap animate-fade-in" style={{ animationDelay: '0.5s' }}>
            {platforms.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-dark-200 text-sm">
                <span className="text-lg">{p.icon}</span>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero dashboard mockup */}
        <div className="max-w-5xl mx-auto px-6 mt-16 relative z-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="glow-purple rounded-2xl overflow-hidden border border-white/10">
            <div className="bg-dark-700 p-1">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-dark-600 rounded-md px-4 py-1 text-xs text-dark-200 text-center">
                    app.viralpostify.com/dashboard
                  </div>
                </div>
              </div>
              {/* Dashboard preview */}
              <div className="bg-dark-800 rounded-xl p-6 grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-4">
                  <div className="flex gap-3">
                    {['bg-primary-500/20 text-primary-400', 'bg-emerald-500/20 text-emerald-400', 'bg-amber-500/20 text-amber-400', 'bg-pink-500/20 text-pink-400'].map((c, i) => (
                      <div key={i} className={`${c} rounded-xl p-4 flex-1`}>
                        <div className="text-xs opacity-70 mb-1">{['Total Posts', 'Published', 'Scheduled', 'Engagement'][i]}</div>
                        <div className="text-xl font-bold">{['1,247', '892', '355', '94.2%'][i]}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-dark-700 rounded-xl p-4">
                    <div className="text-sm font-medium mb-3 text-dark-50">Content Calendar</div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 14 }, (_, i) => (
                        <div key={i} className={`h-8 rounded-lg ${i % 3 === 0 ? 'bg-primary-500/30' : i % 4 === 0 ? 'bg-accent-500/30' : 'bg-dark-600'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-dark-700 rounded-xl p-4">
                    <div className="text-sm font-medium mb-2 text-dark-50">AI Writer</div>
                    <div className="space-y-2">
                      <div className="h-3 bg-primary-500/20 rounded w-full" />
                      <div className="h-3 bg-primary-500/15 rounded w-4/5" />
                      <div className="h-3 bg-primary-500/10 rounded w-3/5" />
                    </div>
                    <div className="mt-3 text-xs bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg py-2 text-center font-medium">
                      Generate
                    </div>
                  </div>
                  <div className="bg-dark-700 rounded-xl p-4">
                    <div className="text-sm font-medium mb-2 text-dark-50">Platforms</div>
                    <div className="flex flex-wrap gap-2">
                      {['𝕏', '📸', 'in', 'f', '♪'].map((icon, i) => (
                        <div key={i} className="w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center text-sm">
                          {icon}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className="bg-dark-800 border-y border-white/5 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Active Creators' },
              { value: '2M+', label: 'Posts Published' },
              { value: '500M+', label: 'Total Reach' },
              { value: '58', label: 'Languages Supported' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl lg:text-4xl font-extrabold gradient-text-blue">{stat.value}</div>
                <div className="text-sm text-dark-200 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section id="features" className="py-24 bg-dark-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-primary-400 bg-primary-500/10 px-4 py-1.5 rounded-full mb-4">
              Features
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-4">
              Everything You Need to <span className="gradient-text">Go Viral</span>
            </h2>
            <p className="text-lg text-dark-200 max-w-2xl mx-auto">
              One platform to create, schedule, automate, and analyze all your social media content.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="feature-card group bg-dark-800 border border-white/5 rounded-2xl p-8 hover:border-white/10"
              >
                <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-5 text-white group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-dark-200 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-24 bg-dark-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-accent-400 bg-accent-500/10 px-4 py-1.5 rounded-full mb-4">
              How It Works
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-4">
              3 Steps to <span className="gradient-text">Content Freedom</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create with AI',
                desc: 'Type a topic. Our AI generates scroll-stopping posts, captions, and hashtags in seconds.',
                gradient: 'from-primary-500 to-violet-500',
              },
              {
                step: '02',
                title: 'Schedule & Automate',
                desc: 'Pick platforms, set dates, or let our AI choose optimal times. Queue up weeks of content instantly.',
                gradient: 'from-violet-500 to-accent-500',
              },
              {
                step: '03',
                title: 'Grow on Autopilot',
                desc: 'Posts go live automatically. Track performance, iterate, and watch your audience explode.',
                gradient: 'from-accent-500 to-amber-500',
              },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} text-2xl font-extrabold mb-6 group-hover:scale-110 transition-transform`}>
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-dark-200">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="py-24 bg-dark-900 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-4">
              Loved by <span className="gradient-text">10,000+</span> Creators
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="bg-dark-800 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-dark-100 mb-5 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-dark-300">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section id="pricing" className="py-24 bg-dark-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-primary-400 bg-primary-500/10 px-4 py-1.5 rounded-full mb-4">
              Pricing
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h2>
            <p className="text-lg text-dark-200 mb-8">Start free. Upgrade when you&apos;re ready. Cancel anytime.</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-dark-700 rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly' ? 'bg-white text-dark-900' : 'text-dark-200 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'yearly' ? 'bg-white text-dark-900' : 'text-dark-200 hover:text-white'
                }`}
              >
                Yearly <span className="text-emerald-400 text-xs font-bold ml-1">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {pricingPlans.map((plan) => {
              const price = billingCycle === 'yearly' ? Math.round(plan.price * 0.8) : plan.price;
              return (
                <div
                  key={plan.name}
                  className={plan.popular ? 'pricing-popular' : ''}
                >
                  <div className={`${plan.popular ? 'pricing-popular-inner' : 'bg-dark-700 border border-white/5'} rounded-2xl p-8 h-full ${plan.popular ? 'text-dark-900' : ''}`}>
                    {plan.popular && (
                      <div className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                        Most Popular
                      </div>
                    )}
                    <h3 className={`text-xl font-bold ${plan.popular ? 'text-dark-900' : ''}`}>{plan.name}</h3>
                    <p className={`text-sm mt-1 ${plan.popular ? 'text-dark-300' : 'text-dark-200'}`}>{plan.description}</p>
                    <div className="mt-6 mb-6">
                      <span className={`text-5xl font-extrabold ${plan.popular ? 'text-dark-900' : ''}`}>${price}</span>
                      <span className={`${plan.popular ? 'text-dark-300' : 'text-dark-200'}`}>/month</span>
                      {billingCycle === 'yearly' && (
                        <div className={`text-sm mt-1 ${plan.popular ? 'text-dark-400' : 'text-dark-300'}`}>
                          Billed ${price * 12}/year
                        </div>
                      )}
                    </div>
                    <Link
                      href="/register"
                      className={`block text-center py-3 rounded-xl font-semibold transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:opacity-90'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                    <ul className="mt-8 space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className={`flex items-start gap-2 text-sm ${plan.popular ? 'text-dark-400' : 'text-dark-200'}`}>
                          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-emerald-500' : 'text-emerald-400'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section id="faq" className="py-24 bg-dark-900">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full mb-4">
              FAQ
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold">
              Got <span className="gradient-text">Questions?</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-dark-800 border border-white/5 rounded-xl overflow-hidden transition-all hover:border-white/10"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-dark-200 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-dark-200 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-24 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[150px] animate-glow" />
        </div>
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">
            Ready to <span className="gradient-text">10x Your Social Media?</span>
          </h2>
          <p className="text-lg text-dark-100 mb-10">
            Join 10,000+ creators and agencies who are growing faster with Viralpostify.
            Start your free trial today — no credit card required.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white font-semibold text-lg px-10 py-4 rounded-full transition-all"
          >
            Start FREE Week
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-dark-900 border-t border-white/5 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-bold text-sm">
                  V
                </div>
                <span className="text-lg font-bold">Viralpostify</span>
              </div>
              <p className="text-sm text-dark-300 leading-relaxed">
                AI-powered social media automation platform. Create, schedule, and grow on every platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-dark-200">Product</h4>
              <ul className="space-y-2 text-sm text-dark-300">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-dark-200">Company</h4>
              <ul className="space-y-2 text-sm text-dark-300">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Affiliates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-dark-200">Legal</h4>
              <ul className="space-y-2 text-sm text-dark-300">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 mt-12 pt-8 text-center text-sm text-dark-400">
            &copy; {new Date().getFullYear()} Viralpostify.com &mdash; All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
