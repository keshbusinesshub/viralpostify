'use client';

import { useState } from 'react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: 29,
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
    popular: false,
  },
  {
    name: 'Creator',
    price: 97,
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
    popular: true,
  },
  {
    name: 'Agency',
    price: 499,
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
    popular: false,
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Nav */}
      <nav className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-bold text-sm">V</div>
            <span className="text-lg font-bold">Viralpostify</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-dark-100 hover:text-white px-3 py-2">Log in</Link>
            <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-primary-500 to-accent-500 text-white px-5 py-2 rounded-full">
              Start FREE Trial
            </Link>
          </div>
        </div>
      </nav>

      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-primary-400 bg-primary-500/10 px-4 py-1.5 rounded-full mb-4">Pricing</span>
            <h1 className="text-5xl font-extrabold mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h1>
            <p className="text-lg text-dark-200 mb-8">Start free for 7 days. Upgrade when you&apos;re ready. Cancel anytime.</p>

            <div className="inline-flex items-center gap-3 bg-dark-700 rounded-full p-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billing === 'monthly' ? 'bg-white text-dark-900' : 'text-dark-200 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billing === 'yearly' ? 'bg-white text-dark-900' : 'text-dark-200 hover:text-white'}`}
              >
                Yearly <span className="text-emerald-400 text-xs font-bold ml-1">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => {
              const price = billing === 'yearly' ? Math.round(plan.price * 0.8) : plan.price;
              return (
                <div key={plan.name} className={plan.popular ? 'pricing-popular' : ''}>
                  <div className={`${plan.popular ? 'pricing-popular-inner p-8' : 'bg-dark-700 border border-white/5 p-8'} rounded-2xl h-full ${plan.popular ? 'text-dark-900' : ''}`}>
                    {plan.popular && (
                      <div className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">Most Popular</div>
                    )}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className={`text-sm mt-1 ${plan.popular ? 'text-dark-300' : 'text-dark-200'}`}>{plan.description}</p>
                    <div className="mt-6 mb-6">
                      <span className="text-5xl font-extrabold">${price}</span>
                      <span className={plan.popular ? 'text-dark-300' : 'text-dark-200'}>/month</span>
                      {billing === 'yearly' && (
                        <div className={`text-sm mt-1 ${plan.popular ? 'text-dark-400' : 'text-dark-300'}`}>Billed ${price * 12}/year</div>
                      )}
                    </div>
                    <Link
                      href="/register"
                      className={`block text-center py-3 rounded-xl font-semibold transition-all ${plan.popular ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:opacity-90' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      Start Free Trial
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

          <div className="text-center mt-12">
            <p className="text-dark-300 text-sm">All plans include a 7-day free trial. No credit card required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
