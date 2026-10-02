'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wallet, Lock, ArrowRight, ShieldCheck, Database, UserCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SecurityBanner from '@/components/SecurityBanner';

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
    <div className="min-h-screen flex flex-col bg-fintech-dark text-white">
      <Navbar />
      <SecurityBanner />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-fintech-card border border-gray-800 rounded-2xl p-8 shadow-2xl relative">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 mx-auto flex items-center justify-center mb-3 shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Sign In to Wallet</h2>
              <p className="text-xs text-gray-400 mt-1">Fintech Mini Wallet</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Email or Username
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. alice or alice@fast.edu"
                  className="w-full bg-fintech-dark border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-fintech-dark border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Demo Quick Account Selector */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
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
                <div className="text-[11px] text-emerald-400 mb-3 bg-emerald-950/40 p-2 rounded border border-emerald-900 font-mono text-center">
                  {seedMsg}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center">
                <button
                  type="button"
                  onClick={() => quickFill('alice')}
                  className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs rounded-lg border border-gray-700 transition"
                >
                  Alice ($1000)
                </button>
                <button
                  type="button"
                  onClick={() => quickFill('bob')}
                  className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs rounded-lg border border-gray-700 transition"
                >
                  Bob ($1000)
                </button>
                <button
                  type="button"
                  onClick={() => quickFill('attacker')}
                  className="px-2 py-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-300 text-xs rounded-lg border border-red-800/60 transition"
                >
                  Attacker ($250)
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-400 font-semibold hover:underline">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
