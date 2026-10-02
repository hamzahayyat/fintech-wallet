'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  ShieldAlert,
  LogOut,
  Sliders,
  HelpCircle,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
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

  const menuItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Wallet', href: '/dashboard', icon: Wallet },
    { name: 'Transactions', href: '#transactions', icon: ArrowRightLeft },
    { name: 'Exploit Tests', href: '#exploit-tests', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 bg-[#181c27] border-r border-[#2a3142] flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none p-5">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-3 py-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
            W
          </div>
          <div>
            <h1 className="font-bold text-base text-white leading-tight">Fintech Wallet</h1>
            <p className="text-[11px] text-slate-400">Security Dashboard</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#202636]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation & Logout */}
      <div className="space-y-1.5 pt-4 border-t border-[#2a3142]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-[#202636] transition-all text-left"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
