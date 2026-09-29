'use client';

import React from 'react';
import { SecurityModeProvider } from '@/context/SecurityModeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SecurityModeProvider>{children}</SecurityModeProvider>;
}
