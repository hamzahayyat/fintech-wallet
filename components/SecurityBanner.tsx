'use client';

import React from 'react';
import { useSecurityMode } from '@/context/SecurityModeContext';
import { AlertTriangle, CheckCircle2, ShieldAlert, Lock } from 'lucide-react';

export default function SecurityBanner() {
  const { securityMode } = useSecurityMode();
  const isSecure = securityMode === 'secure';

  return (
    <div
      className={`w-full py-2.5 px-4 text-xs sm:text-sm font-medium border-b transition-colors duration-300 ${
        isSecure
          ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-200'
          : 'bg-red-950/40 border-red-900/50 text-red-200'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isSecure ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>
            <strong>{isSecure ? 'SECURE CONTROLS ACTIVE:' : 'VULNERABLE MODE ACTIVE:'}</strong>{' '}
            {isSecure
              ? 'Strict JWT session verification (Anti-BOLA), Zod schema validation (Amount > 0), Prisma $transaction (Atomic updates).'
              : 'App is intentionally exposing BOLA (spoof sender_id), Non-Atomic DB updates, and Negative Fund Transfers!'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <span className="px-2 py-0.5 rounded bg-black/30 border border-current opacity-80">
            Header: x-security-mode = {securityMode}
          </span>
        </div>
      </div>
    </div>
  );
}
