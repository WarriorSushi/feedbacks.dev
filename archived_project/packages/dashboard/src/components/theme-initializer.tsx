'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { initializeTheme, applyTheme, getCurrentTheme } from '@/lib/themes';

export function ThemeInitializer() {
  const { theme: colorMode, systemTheme } = useTheme();
  const isInitialized = useRef(false);

  useEffect(() => {
    // Initialize theme on mount only once
    if (!isInitialized.current) {
      initializeTheme();
      isInitialized.current = true;

      // Apply initial theme
      const currentTheme = getCurrentTheme();
      const isDark = colorMode === 'dark' || (colorMode === 'system' && systemTheme === 'dark');
      applyTheme(currentTheme, isDark);
    }
  }, []); // Only run on mount

  // Handle system theme changes (when theme is set to 'system')
  useEffect(() => {
    if (isInitialized.current && colorMode === 'system') {
      const currentTheme = getCurrentTheme();
      const isDark = systemTheme === 'dark';
      applyTheme(currentTheme, isDark);
    }
  }, [systemTheme, colorMode]);

  return null;
}