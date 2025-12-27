import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from './contexts/SettingsContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DailyLog from './pages/DailyLog';
import Customers from './pages/Customers';
import Billing from './pages/Billing';
import Stock from './pages/Stock';
import Sources from './pages/Sources';
import SettingsDrawer from './components/SettingsDrawer';

import { ConfigProvider, theme as antTheme } from 'antd';
// We'll use the dynamic theme instead
// import theme from './theme/themeConfig';

const AppContent: React.FC = () => {
  const { primaryColor, isDarkMode, borderRadius } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: primaryColor,
          borderRadius: borderRadius,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
            Button: {
                controlHeight: 36,
                borderRadius: borderRadius * 2.25, // Rounded buttons
                fontWeight: 500,
            },
            Card: {
                borderRadius: borderRadius * 1.5,
            },
            Layout: {
                colorBgHeader: isDarkMode ? '#141414' : '#ffffff',
                colorBgBody: isDarkMode ? '#000000' : '#f8f9fa',
                colorBgTrigger: isDarkMode ? '#141414' : '#ffffff',
            }
        }
      }}
    >
        <SettingsProvider>
            <BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                duration: 3000,
                style: {
                    background: isDarkMode ? '#333' : '#1f2937',
                    color: '#f9fafb',
                    borderRadius: '10px',
                    padding: '12px 16px',
                },
                success: {
                    iconTheme: {
                    primary: '#22c55e',
                    secondary: '#f9fafb',
                    },
                },
                error: {
                    iconTheme: {
                    primary: '#ef4444',
                    secondary: '#f9fafb',
                    },
                },
                }}
            />
            <Routes>
                <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="daily-log" element={<DailyLog />} />
                <Route path="customers" element={<Customers />} />
                <Route path="billing" element={<Billing />} />
                <Route path="stock" element={<Stock />} />
                <Route path="sources" element={<Sources />} />
                </Route>
            </Routes>
            <SettingsDrawer />
            </BrowserRouter>
        </SettingsProvider>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
};

export default App;
