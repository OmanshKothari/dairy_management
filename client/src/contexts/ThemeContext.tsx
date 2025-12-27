import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ThemeState {
  primaryColor: string;
  isDarkMode: boolean;
  borderRadius: number;
}

interface ThemeContextType extends ThemeState {
  setPrimaryColor: (color: string) => void;
  toggleDarkMode: () => void;
  setBorderRadius: (radius: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_THEME: ThemeState = {
  primaryColor: '#1a73e8', // Google Blue
  isDarkMode: false,
  borderRadius: 8,
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeState>(() => {
    const saved = localStorage.getItem('app-theme-prefs');
    return saved ? JSON.parse(saved) : DEFAULT_THEME;
  });

  useEffect(() => {
    localStorage.setItem('app-theme-prefs', JSON.stringify(theme));
  }, [theme]);

  const setPrimaryColor = (color: string) => {
    setTheme(prev => ({ ...prev, primaryColor: color }));
  };

  const toggleDarkMode = () => {
    setTheme(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  const setBorderRadius = (radius: number) => {
    setTheme(prev => ({ ...prev, borderRadius: radius }));
  };

  return (
    <ThemeContext.Provider value={{ ...theme, setPrimaryColor, toggleDarkMode, setBorderRadius }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
