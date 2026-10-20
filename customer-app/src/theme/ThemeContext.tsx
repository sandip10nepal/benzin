import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RestaurantThemeConfig } from '../types';
import { STORAGE_KEYS } from '../services/api';

export const CAVALLI_DARK_THEME: RestaurantThemeConfig = {
  id: 'cavalli_dark',
  name: 'CAVALLI',
  tagline: 'Lounge & Dining Experience',
  tableNumber: '1',
  primaryColor: '#0099FF', // Vibrant Sky Blue
  secondaryColor: '#E5B13A', // Cavalli Gold
  accentColor: '#14B8A6', // Emerald Teal
  backgroundColor: '#0C0806', // Velvet luxury black/amber
  cardColor: '#19120E', // Rich dark brown card
  textColor: '#F8F1EA', // Warm cream text
  mutedTextColor: '#9C8C7E', // Soft muted bronze
  borderColor: '#2E2017', // Subtle border line
  mode: 'dark',
};

export const CAVALLI_LIGHT_THEME: RestaurantThemeConfig = {
  id: 'cavalli_light',
  name: 'CAVALLI',
  tagline: 'Lounge & Dining Experience',
  tableNumber: '1',
  primaryColor: '#0284C7', // Deep Sky Blue
  secondaryColor: '#C5911A', // Deep champagne gold
  accentColor: '#0D9488', // Deep rich teal
  backgroundColor: '#F7F4EE', // Warm bright ivory background
  cardColor: '#FFFFFF', // Pure white card background
  textColor: '#1A120B', // Deep rich dark roast text
  mutedTextColor: '#6B5B4E', // Warm muted bronze text
  borderColor: '#E5DDCB', // Crisp subtle gold border
  mode: 'light',
};

interface ThemeContextType {
  theme: RestaurantThemeConfig;
  themeMode: 'dark' | 'light';
  toggleThemeMode: () => void;
  updateTheme: (newTheme: Partial<RestaurantThemeConfig>) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: CAVALLI_DARK_THEME,
  themeMode: 'dark',
  toggleThemeMode: () => {},
  updateTheme: () => {},
  resetTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [themeOverrides, setThemeOverrides] = useState<Partial<RestaurantThemeConfig>>({});

  useEffect(() => {
    // Load persisted restaurant name and table number on app startup
    const loadPersistedSettings = async () => {
      try {
        const storedName = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_RESTAURANT_NAME);
        const storedTable = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_TABLE_NUMBER);

        const updates: Partial<RestaurantThemeConfig> = {};
        if (storedName) updates.name = storedName.toUpperCase();
        if (storedTable) updates.tableNumber = storedTable;

        if (Object.keys(updates).length > 0) {
          setThemeOverrides((prev) => ({ ...prev, ...updates }));
        }
      } catch (err) {
        console.warn('Failed to load persisted theme settings:', err);
      }
    };

    loadPersistedSettings();
  }, []);

  const activeBaseTheme = themeMode === 'light' ? CAVALLI_LIGHT_THEME : CAVALLI_DARK_THEME;
  const currentTheme = { ...activeBaseTheme, ...themeOverrides };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const activeMode = currentTheme.mode || themeMode;
      const chromeColor = currentTheme.backgroundColor || (activeMode === 'light' ? '#F7F4EE' : '#0C0806');

      document.documentElement.style.setProperty('--browser-chrome-color', chromeColor);
      document.documentElement.style.setProperty('--theme-bg', chromeColor);
      document.documentElement.setAttribute('data-theme', activeMode);

      document.documentElement.style.backgroundColor = chromeColor;
      document.body.style.backgroundColor = chromeColor;
      const rootElem = document.getElementById('root');
      if (rootElem) rootElem.style.backgroundColor = chromeColor;

      const metaThemeList = document.querySelectorAll('meta[name="theme-color"]');
      if (metaThemeList.length > 0) {
        metaThemeList.forEach((meta) => {
          (meta as HTMLMetaElement).content = chromeColor;
        });
      } else {
        const metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        metaTheme.content = chromeColor;
        document.head.appendChild(metaTheme);
      }

      let metaColorScheme = document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement;
      if (!metaColorScheme) {
        metaColorScheme = document.createElement('meta');
        metaColorScheme.name = 'color-scheme';
        document.head.appendChild(metaColorScheme);
      }
      metaColorScheme.content = activeMode;

      let metaAppleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
      if (!metaAppleStatus) {
        metaAppleStatus = document.createElement('meta');
        metaAppleStatus.name = 'apple-mobile-web-app-status-bar-style';
        document.head.appendChild(metaAppleStatus);
      }
      metaAppleStatus.content = 'black-translucent';
    }
  }, [currentTheme.backgroundColor, currentTheme.mode, themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const updateTheme = (newTheme: Partial<RestaurantThemeConfig>) => {
    setThemeOverrides((prev) => ({ ...prev, ...newTheme }));

    // Persist key branding settings to AsyncStorage
    if (newTheme.name) {
      AsyncStorage.setItem(STORAGE_KEYS.PAIRED_RESTAURANT_NAME, newTheme.name).catch(() => {});
    }
    if (newTheme.tableNumber) {
      AsyncStorage.setItem(STORAGE_KEYS.PAIRED_TABLE_NUMBER, String(newTheme.tableNumber)).catch(() => {});
    }
  };

  const resetTheme = () => {
    setThemeOverrides({});
    setThemeMode('dark');
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, themeMode, toggleThemeMode, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useRestaurantTheme = () => useContext(ThemeContext);
