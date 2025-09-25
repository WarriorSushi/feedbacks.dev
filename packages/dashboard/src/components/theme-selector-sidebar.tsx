'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Check, Palette } from 'lucide-react';
import { themes, applyTheme, getCurrentTheme, type Theme } from '@/lib/themes';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function ThemeSelectorSidebar() {
  const [selectedTheme, setSelectedTheme] = useState('claude');
  const [open, setOpen] = useState(false);
  const { theme: colorMode } = useTheme();
  const isDark = colorMode === 'dark';

  useEffect(() => {
    setSelectedTheme(getCurrentTheme());
  }, []);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    applyTheme(themeId, isDark);
    setOpen(false);
  };

  const currentTheme = themes.find(t => t.id === selectedTheme);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between h-auto px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <div className="text-left">
              <div className="text-sm font-medium">Themes</div>
              <div className="text-xs text-muted-foreground">
                {currentTheme?.name || 'Claude'}
              </div>
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" side="right" align="start">
        <div className="p-3">
          <h4 className="font-medium text-sm mb-2">Choose a theme</h4>
          <div className="grid grid-cols-1 gap-1.5">
            {themes.map((theme) => (
              <ThemeOption
                key={theme.id}
                theme={theme}
                isSelected={selectedTheme === theme.id}
                onClick={() => handleThemeChange(theme.id)}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ThemeOptionProps {
  theme: Theme;
  isSelected: boolean;
  onClick: () => void;
}

function ThemeOption({ theme, isSelected, onClick }: ThemeOptionProps) {
  return (
    <div
      className={cn(
        "relative cursor-pointer rounded border p-2 hover:bg-accent/30 transition-colors",
        isSelected ? 'ring-1 ring-primary bg-accent/50' : ''
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {/* Theme Preview - Smaller */}
        <div className="relative flex-shrink-0">
          <div
            className="h-6 w-10 rounded overflow-hidden border flex"
            style={{ backgroundColor: theme.preview.background }}
          >
            <div
              className="w-1/3 h-full"
              style={{ backgroundColor: theme.preview.primary }}
            />
            <div
              className="w-1/3 h-full"
              style={{ backgroundColor: theme.preview.secondary }}
            />
            <div
              className="w-1/3 h-full"
              style={{ backgroundColor: theme.preview.accent }}
            />
          </div>

          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full p-0.5">
              <Check className="h-2.5 w-2.5" />
            </div>
          )}
        </div>

        {/* Theme Info - Compact */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-medium text-sm truncate">{theme.name}</h3>
            {isSelected && (
              <Badge variant="default" className="text-xs px-1.5 py-0 h-4">
                Active
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {theme.description}
          </p>
        </div>
      </div>
    </div>
  );
}