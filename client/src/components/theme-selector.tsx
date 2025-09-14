import React, { useState } from 'react';
import { useTheme, type Theme } from '@/contexts/theme-context';
import { ChevronDownIcon } from 'lucide-react';

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'blue', label: 'Blue', icon: '🌊' },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[0];

  return (
    <div className="relative" data-testid="theme-selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-background/80 transition-all"
        data-testid="theme-selector-button"
      >
        <span className="text-sm">{currentTheme.icon}</span>
        <span className="text-sm font-medium hidden sm:inline">{currentTheme.label}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-32 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg z-20">
            {themes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => {
                  setTheme(themeOption.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-primary/10 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  theme === themeOption.value ? 'bg-primary/20 text-primary' : ''
                }`}
                data-testid={`theme-option-${themeOption.value}`}
              >
                <span className="text-sm">{themeOption.icon}</span>
                <span className="text-sm font-medium">{themeOption.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}