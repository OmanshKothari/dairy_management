import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DailyLog from './pages/DailyLog';
import Customers from './pages/Customers';
import Billing from './pages/Billing';
import Stock from './pages/Stock';
import Sources from './pages/Sources';

import { ConfigProvider } from 'antd';
import theme from './theme/themeConfig';

const App: React.FC = () => {
  return (
    <ConfigProvider theme={theme}>
      <SettingsProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1f2937',
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
        </BrowserRouter>
      </SettingsProvider>
    </ConfigProvider>
  );
};

export default App;
