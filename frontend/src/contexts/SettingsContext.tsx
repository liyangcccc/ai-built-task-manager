import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsApi } from '../services/api';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh';
  timezone: string;
}

interface SettingsContextType {
  settings: UserSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  effectiveTheme: 'light' | 'dark';
}

const defaultSettings: UserSettings = {
  theme: 'system',
  language: 'en',
  timezone: 'America/New_York'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Update effective theme when settings change or system preference changes
  useEffect(() => {
    updateEffectiveTheme();
  }, [settings.theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'system') {
        updateEffectiveTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getSettings();
      
      if (response.success) {
        setSettings(response.data);
      } else {
        console.error('Failed to load settings:', response.error);
        // Use default settings on error
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings on error
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateEffectiveTheme = () => {
    let newTheme: 'light' | 'dark';
    
    if (settings.theme === 'system') {
      // Use system preference
      newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      newTheme = settings.theme;
    }
    
    setEffectiveTheme(newTheme);
    
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const response = await settingsApi.updateSettings(newSettings);
      
      if (response.success) {
        setSettings(response.data);
      } else {
        throw new Error(response.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const resetSettings = async () => {
    try {
      const response = await settingsApi.resetSettings();
      
      if (response.success) {
        setSettings(response.data);
      } else {
        throw new Error(response.error || 'Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  };

  const contextValue: SettingsContextType = {
    settings,
    loading,
    updateSettings,
    resetSettings,
    effectiveTheme
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;