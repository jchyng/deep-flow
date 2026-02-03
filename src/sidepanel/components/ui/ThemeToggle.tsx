import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface ThemeToggleProps {
  theme: 'dark' | 'light' | 'system';
  onToggle: () => void;
}

function getResolvedTheme(theme: ThemeToggleProps['theme']): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function getThemeLabel(theme: ThemeToggleProps['theme'], resolved: 'dark' | 'light'): string {
  if (theme === 'system') {
    return `System (${resolved})`;
  }
  return resolved === 'dark' ? 'Dark mode' : 'Light mode';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const resolved = getResolvedTheme(theme);
  const label = getThemeLabel(theme, resolved);
  
  return (
    <Tooltip content={label}>
      <button
        onClick={onToggle}
        className="p-2 text-focus-muted hover:text-focus-accent rounded-full transition-all"
        aria-label="Toggle theme"
      >
        {resolved === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </Tooltip>
  );
};
