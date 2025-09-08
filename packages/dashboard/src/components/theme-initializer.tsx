'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { initializeTheme, applyTheme, getCurrentTheme } from '@/lib/themes';

export function ThemeInitializer() {
  const { theme: colorMode, systemTheme } = useTheme();

  useEffect(() => {
    // Initialize theme on mount
    initializeTheme();

    // Apply theme when color mode changes (light/dark toggle)
    const currentTheme = getCurrentTheme();
    const isDark = colorMode === 'dark' || (colorMode === 'system' && systemTheme === 'dark');
    applyTheme(currentTheme, isDark);
  }, [colorMode, systemTheme]);

  return null;
}