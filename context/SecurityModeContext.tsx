'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type SecurityMode = 'vulnerable' | 'secure';

interface SecurityModeContextType {
  securityMode: SecurityMode;
  toggleSecurityMode: () => void;
  setSecurityMode: (mode: SecurityMode) => void;
  fetchWithSecurityMode: (url: string, options?: RequestInit) => Promise<Response>;
}

const SecurityModeContext = createContext<SecurityModeContextType | undefined>(undefined);

export function SecurityModeProvider({ children }: { children: React.ReactNode }) {
  const [securityMode, setSecurityModeState] = useState<SecurityMode>('secure');

  useEffect(() => {
    const saved = localStorage.getItem('cy5004_security_mode') as SecurityMode;
    if (saved === 'vulnerable' || saved === 'secure') {
      setSecurityModeState(saved);
    }
  }, []);

  const setSecurityMode = (mode: SecurityMode) => {
    setSecurityModeState(mode);
    localStorage.setItem('cy5004_security_mode', mode);
  };

  const toggleSecurityMode = () => {
    setSecurityMode(securityMode === 'secure' ? 'vulnerable' : 'secure');
  };

  const fetchWithSecurityMode = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    headers.set('x-security-mode', securityMode);

    return fetch(url, {
      ...options,
      headers,
    });
  };

  return (
    <SecurityModeContext.Provider
      value={{
        securityMode,
        toggleSecurityMode,
        setSecurityMode,
        fetchWithSecurityMode,
      }}
    >
      {children}
    </SecurityModeContext.Provider>
  );
}

export function useSecurityMode() {
  const context = useContext(SecurityModeContext);
  if (!context) {
    throw new Error('useSecurityMode must be used within a SecurityModeProvider');
  }
  return context;
}
