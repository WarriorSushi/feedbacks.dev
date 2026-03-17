'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { themes, applyTheme, getCurrentTheme, type Theme } from '@/lib/themes';
import { useTheme } from 'next-themes';

export function ThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState('claude');
  const { theme: colorMode } = useTheme();
  const isDark = colorMode === 'dark';

  useEffect(() => {
    setSelectedTheme(getCurrentTheme());
  }, []);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    applyTheme(themeId, isDark);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
        {themes.map((theme) => (
          <ThemePreviewCard
            key={theme.id}
            theme={theme}
            isSelected={selectedTheme === theme.id}
            onClick={() => handleThemeChange(theme.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ThemePreviewCardProps {
  theme: Theme;
  isSelected: boolean;
  onClick: () => void;
}

function ThemePreviewCard({ theme, isSelected, onClick }: ThemePreviewCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover-lift ${
        isSelected ? 'ring-2 ring-primary ring-offset-1' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-2 sm:p-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Preview - Smaller and horizontal */}
          <div className="relative flex-shrink-0">
            <div
              className="w-12 h-8 sm:w-16 sm:h-10 rounded overflow-hidden border flex"
              style={{ backgroundColor: theme.preview.background }}
            >
              {/* Color strips */}
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
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                <Check className="h-2.5 w-2.5" />
              </div>
            )}
          </div>

          {/* Theme Info - Compact */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-medium text-sm truncate">{theme.name}</h3>
                <p className="text-xs text-muted-foreground truncate sm:block hidden">
                  {theme.description}
                </p>
              </div>

              {/* Compact Select Button */}
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="h-7 px-2 text-xs flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                {isSelected ? (
                  <Check className="h-3 w-3" />
                ) : (
                  'Select'
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}