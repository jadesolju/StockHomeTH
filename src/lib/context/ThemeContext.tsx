'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  const applyTheme = useCallback((mode: ThemeMode) => {
    let resolved: 'dark' | 'light' = 'dark';
    if (mode === 'system') {
      const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = systemDark ? 'dark' : 'light';
    } else {
      resolved = mode;
    }
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, []);

  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('stockhome_theme') as ThemeMode) || 'dark';
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } catch {
      applyTheme('dark');
    }

    // Listener for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const current = (localStorage.getItem('stockhome_theme') as ThemeMode) || 'dark';
      if (current === 'system') {
        applyTheme('system');
      }
    };

    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [applyTheme]);

  const setTheme = useCallback(
    (nextMode: ThemeMode) => {
      setThemeState(nextMode);
      try {
        localStorage.setItem('stockhome_theme', nextMode);
      } catch {
        // Ignore
      }
      applyTheme(nextMode);
    },
    [applyTheme]
  );

  const cycleTheme = useCallback(() => {
    const order: ThemeMode[] = ['dark', 'light', 'system'];
    const nextIdx = (order.indexOf(theme) + 1) % order.length;
    setTheme(order[nextIdx]);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
