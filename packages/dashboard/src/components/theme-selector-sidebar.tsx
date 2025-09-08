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
          className="w-full justify-between h-auto px-3 py-2 transition-colors duration-150"
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
      <PopoverContent className="w-80 p-0" side="right" align="start">
        <div className="p-4">
          <h4 className="font-medium text-sm mb-3">Choose a theme</h4>
          <div className="grid grid-cols-1 gap-3">
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
        "relative cursor-pointer rounded-lg border p-3 transition-all hover:shadow-sm",
        isSelected ? 'ring-2 ring-primary ring-offset-2 bg-accent/50' : 'hover:border-primary/50'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Theme Preview */}
        <div className="relative h-12 w-16 rounded-md overflow-hidden border flex-shrink-0">
          <div 
            className="h-full w-full flex"
            style={{ backgroundColor: theme.preview.background }}
          >
            {/* Primary section */}
            <div 
              className="w-1/3 h-full"
              style={{ backgroundColor: theme.preview.primary }}
            />
            {/* Secondary section */}
            <div 
              className="w-1/3 h-full"
              style={{ backgroundColor: theme.preview.secondary }}
            />
            {/* Accent section */}
            <div 
              className="w-1/3 h-full"
              style={{ backgroundColor: theme.preview.accent }}
            />
          </div>
          
          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
              <Check className="h-3 w-3" />
            </div>
          )}
        </div>

        {/* Theme Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm truncate">{theme.name}</h3>
            {isSelected && (
              <Badge variant="default" className="text-xs ml-2">
                Active
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {theme.description}
          </p>
          {theme.fonts && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              {theme.fonts.sans.split(',')[0]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}