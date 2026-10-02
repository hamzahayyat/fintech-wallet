'use client';

import React from 'react';
import { useSecurityMode } from '@/context/SecurityModeContext';
import { ShieldCheck, ShieldAlert, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  user?: {
    username: string;
    email: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const { securityMode, toggleSecurityMode } = useSecurityMode();
  const isSecure = securityMode === 'secure';

  return (
    <header className="h-20 px-8 border-b border-[#2a3142] bg-[#181c27] flex items-center justify-between sticky top-0 z-30">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Welcome Back, <span className="text-blue-400">{user?.username || 'User'}</span>!
        </h2>
        <p className="text-xs text-slate-400">Manage transactions and test security controls</p>
      </div>

      {/* Right Actions: Security Mode Toggle + User Pill */}
      <div className="flex items-center gap-4">
        {/* Security Mode Switch Pill */}
        <button
          onClick={toggleSecurityMode}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            isSecure
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
          }`}
        >
          {isSecure ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Mode: Secure</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Mode: Vulnerable</span>
            </>
          )}
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 border border-current">
            Switch
          </span>
        </button>

        {/* User Pill */}
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#202636] border border-[#2a3142] rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="text-left text-xs">
              <p className="font-semibold text-white leading-none">{user.username}</p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
