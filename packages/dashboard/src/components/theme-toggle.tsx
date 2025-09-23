'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = theme === 'dark';
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Sun
        className={`h-4 w-4 transition-colors ${mounted && !isDark ? 'text-orange-500' : 'text-muted-foreground/50'}`}
      />
      <Switch
        checked={mounted ? isDark : false}
        disabled={!mounted}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        className="data-[state=checked]:bg-slate-700 data-[state=unchecked]:bg-orange-400"
      />
      <Moon
        className={`h-4 w-4 transition-colors ${mounted && isDark ? 'text-slate-300' : 'text-muted-foreground/50'}`}
      />
    </div>
  );
}
