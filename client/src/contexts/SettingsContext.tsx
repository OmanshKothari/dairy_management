/**
 * Settings Context
 * 
 * Provides application-wide settings including currency, business info,
 * and configuration options to all components.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Settings } from '../types';
import { settingsApi } from '../services/api';

/**
 * Default settings
 */
const DEFAULT_SETTINGS: Settings = {
  businessName: 'MilkyWay Dairy Services',
  businessAddress: '123 Farm Lane, Countryside',
  businessPhone: '+1 234 567 890',
  defaultPricePerLiter: 2.0,
  currency: 'USD',
  currencySymbol: '$',
  maxCapacity: 2000,
  paymentTermsDays: 5,
};

/**
 * Settings context value type
 */
interface SettingsContextValue {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  formatCurrency: (amount: number) => string;
}

/**
 * Create context with default value
 */
const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

/**
 * Settings Provider Props
 */
interface SettingsProviderProps {
  children: ReactNode;
}

/**
 * Settings Provider Component
 */
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load settings on mount
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await settingsApi.get();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings');
        // Use defaults on error
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  /**
   * Update settings
   */
  const updateSettings = async (data: Partial<Settings>): Promise<void> => {
    try {
      const updated = await settingsApi.update(data);
      setSettings(updated);
    } catch (err) {
      console.error('Failed to update settings:', err);
      throw err;
    }
  };

  /**
   * Reset settings to defaults
   */
  const resetSettings = async (): Promise<void> => {
    try {
      const reset = await settingsApi.reset();
      setSettings(reset);
    } catch (err) {
      console.error('Failed to reset settings:', err);
      throw err;
    }
  };

  /**
   * Format currency based on settings
   */
  const formatCurrency = (amount: number): string => {
    return `${settings.currencySymbol}${amount.toFixed(2)}`;
  };

  const value: SettingsContextValue = {
    settings,
    isLoading,
    error,
    updateSettings,
    resetSettings,
    formatCurrency,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Custom hook to use settings context
 */
export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
};

export default SettingsContext;
