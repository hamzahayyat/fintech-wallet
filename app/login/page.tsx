'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wallet, ArrowRight, Database, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const seedDatabase = async () => {
    setSeedMsg('Seeding database...');
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedMsg('Database seeded! You can now login with Alice, Bob, or Attacker.');
      } else {
        setSeedMsg('Seed error: ' + (data.error || 'Failed'));
      }
    } catch (err: any) {
      setSeedMsg('Seed error: ' + err.message);
    }
  };

  const quickFill = (user: string) => {
    setIdentifier(user);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#131722] text-white p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1e2330] border border-[#2a3142] rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 mx-auto flex items-center justify-center mb-3 text-white font-bold text-xl">
              W
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Sign In to Wallet</h2>
            <p className="text-xs text-slate-400 mt-1">Fintech Mini Wallet</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email or Username
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. bob or alice@fast.edu"
                className="w-full bg-[#181c27] border border-[#2a3142] text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#181c27] border border-[#2a3142] text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Sign-In */}
          <div className="mt-8 pt-6 border-t border-[#2a3142]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Quick Demo Sign-In:
              </span>
              <button
                type="button"
                onClick={seedDatabase}
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
              >
                <Database className="w-3 h-3" />
                Seed Accounts
              </button>
            </div>

            {seedMsg && (
              <div className="text-[11px] text-emerald-400 mb-3 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 font-mono text-center">
                {seedMsg}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center">
              <button
                type="button"
                onClick={() => quickFill('alice')}
                className="px-2 py-2 bg-[#252b3b] hover:bg-[#2e364a] text-slate-200 text-xs rounded-xl border border-[#343d54] transition"
              >
                Alice ($1000)
              </button>
              <button
                type="button"
                onClick={() => quickFill('bob')}
                className="px-2 py-2 bg-[#252b3b] hover:bg-[#2e364a] text-slate-200 text-xs rounded-xl border border-[#343d54] transition"
              >
                Bob ($1000)
              </button>
              <button
                type="button"
                onClick={() => quickFill('attacker')}
                className="px-2 py-2 bg-[#252b3b] hover:bg-[#2e364a] text-slate-200 text-xs rounded-xl border border-[#343d54] transition"
              >
                Attacker ($250)
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-400 font-semibold hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
