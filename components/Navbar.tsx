'use client';

import React from 'react';
import { useSecurityMode } from '@/context/SecurityModeContext';
import { ShieldAlert, ShieldCheck, LogOut, Wallet, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  user?: {
    username: string;
    email: string;
    balance: number;
  } | null;
  onRefresh?: () => void;
}

export default function Navbar({ user, onRefresh }: NavbarProps) {
  const { securityMode, toggleSecurityMode } = useSecurityMode();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isSecure = securityMode === 'secure';

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-fintech-dark/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              Fintech Mini Wallet
            </h1>
            <p className="text-xs text-gray-400">Secure Software Design Project</p>
          </div>
        </div>

        {/* Security Mode Toggle Switch */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center p-1.5 rounded-full border transition-all duration-300 ${
              isSecure
                ? 'bg-emerald-950/60 border-emerald-500/40 glow-secure'
                : 'bg-red-950/60 border-red-500/40 glow-vuln'
            }`}
          >
            <button
              type="button"
              onClick={toggleSecurityMode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300"
            >
              {isSecure ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-emerald-300">Secure Mode Active</span>
                  <div className="w-8 h-4 bg-emerald-500 rounded-full relative flex items-center px-0.5 ml-1">
                    <div className="w-3.5 h-3.5 bg-white rounded-full translate-x-4 transition-transform duration-300" />
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce" />
                  <span className="text-red-300">Vulnerable Mode Active</span>
                  <div className="w-8 h-4 bg-red-600 rounded-full relative flex items-center px-0.5 ml-1">
                    <div className="w-3.5 h-3.5 bg-white rounded-full translate-x-0 transition-transform duration-300" />
                  </div>
                </>
              )}
            </button>
          </div>

          {/* Logged User Info */}
          {user && (
            <div className="flex items-center gap-3 border-l border-gray-800 pl-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-medium text-gray-200 flex items-center justify-end gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                  {user.username}
                </span>
                <span className="text-xs text-emerald-400 font-mono font-semibold">
                  ${user.balance.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
