'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { useThemeAnimation, ThemeAnimationType } from '@space-man/react-theme-animation';
import { applyTheme, getCurrentTheme } from '@/lib/themes';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme: nextTheme, setTheme: setNextTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Use the animation hook for smooth transitions
  const { theme: animTheme, switchTheme, ref } = useThemeAnimation({
    themes: ['light', 'dark'],
    theme: nextTheme === 'dark' ? 'dark' : 'light',
    animationType: ThemeAnimationType.CIRCLE,
    duration: 600,
    onThemeChange: (newTheme) => {
      // Sync with next-themes
      setNextTheme(newTheme);

      // Apply current color theme with new light/dark mode
      const currentColorTheme = getCurrentTheme();
      const isDark = newTheme === 'dark';
      applyTheme(currentColorTheme, isDark);
    }
  });

  // Type the ref properly for div element using unknown first
  const divRef = ref as unknown as React.RefObject<HTMLDivElement>;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? nextTheme === 'dark' : false;

  const handleToggle = (checked: boolean) => {
    switchTheme(checked ? 'dark' : 'light');
  };

  return (
    <div ref={divRef} className={`flex items-center gap-2 ${className}`}>
      <Sun
        className={`h-4 w-4 transition-colors ${mounted && !isDark ? 'text-orange-500' : 'text-muted-foreground/50'}`}
      />
      <Switch
        checked={isDark}
        disabled={!mounted}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-slate-700 data-[state=unchecked]:bg-orange-400"
      />
      <Moon
        className={`h-4 w-4 transition-colors ${mounted && isDark ? 'text-slate-300' : 'text-muted-foreground/50'}`}
      />
    </div>
  );
}
