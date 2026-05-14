import React, { createContext, useContext, useCallback } from 'react';
import type { VibrantColors } from '../utils/vibrant';

type ThemeContextType = {
  applyPalette: (pal: VibrantColors | null) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  applyPalette: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const applyPalette = useCallback((pal: VibrantColors | null) => {
    const root = document.documentElement.style;
    
    if (!pal) {
      // Revert to defaults (CSS variables will take over)
      root.removeProperty('--theme-primary');
      root.removeProperty('--theme-muted');
      root.removeProperty('--theme-dark');
      root.removeProperty('--theme-light');
      root.removeProperty('--theme-contrast');
      return;
    }

    if (pal.vibrant) root.setProperty('--theme-primary', pal.vibrant);
    if (pal.muted) root.setProperty('--theme-muted', pal.muted);
    if (pal.darkVibrant) root.setProperty('--theme-dark', pal.darkVibrant);
    if (pal.lightVibrant) root.setProperty('--theme-light', pal.lightVibrant);
    if (pal.darkMuted) root.setProperty('--theme-contrast', pal.darkMuted);
  }, []);

  return (
    <ThemeContext.Provider value={{ applyPalette }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
