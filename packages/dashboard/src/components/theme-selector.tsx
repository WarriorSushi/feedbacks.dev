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
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Theme Preview */}
          <div className="relative h-20 rounded-lg overflow-hidden border">
            <div 
              className="h-full w-full flex"
              style={{ backgroundColor: theme.preview.background }}
            >
              {/* Left section - Primary */}
              <div 
                className="w-1/3 h-full flex items-center justify-center"
                style={{ backgroundColor: theme.preview.primary }}
              >
                <div className="w-4 h-4 bg-white rounded-full opacity-80" />
              </div>
              
              {/* Middle section - Secondary */}
              <div 
                className="w-1/3 h-full flex items-center justify-center"
                style={{ backgroundColor: theme.preview.secondary }}
              >
                <div className="w-3 h-8 bg-white rounded opacity-60" />
              </div>
              
              {/* Right section - Accent */}
              <div 
                className="w-1/3 h-full flex items-center justify-center"
                style={{ backgroundColor: theme.preview.accent }}
              >
                <div className="w-6 h-3 bg-white rounded-full opacity-70" />
              </div>
            </div>
            
            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-3 w-3" />
              </div>
            )}
          </div>

          {/* Theme Info */}
          <div>
            <h3 className="font-semibold text-sm">{theme.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {theme.description}
            </p>
          </div>

          {/* Select Button */}
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className="w-full h-8"
            onClick={onClick}
          >
            {isSelected ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Selected
              </>
            ) : (
              'Select Theme'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}