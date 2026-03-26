'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-primary-600/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-accent-600/10 rounded-full blur-[100px]" />

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-accent-600/10" />
        <div className="relative z-10 max-w-md">
          <Link href="/" className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-bold text-lg text-white">
              V
            </div>
            <span className="text-2xl font-bold text-white">Viralpostify</span>
          </Link>
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Welcome back to your<br />
            <span className="gradient-text">content engine</span>
          </h2>
          <p className="text-dark-100 text-lg leading-relaxed">
            Create, schedule, and automate your social media content across every platform — all from one dashboard.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              {['bg-violet-500', 'bg-pink-500', 'bg-blue-500', 'bg-emerald-500'].map((c, i) => (
                <div key={i} className={`w-9 h-9 rounded-full ${c} border-2 border-dark-900 flex items-center justify-center text-xs font-bold text-white`}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-dark-200">
              <span className="text-white font-semibold">10,000+</span> creators growing daily
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-bold text-white">
                V
              </div>
              <span className="text-xl font-bold text-white">Viralpostify</span>
            </Link>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">Sign in</h1>
          <p className="text-dark-200 mb-8">Enter your credentials to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-dark-300">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
