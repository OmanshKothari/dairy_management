/**
 * Layout Component
 * 
 * Main layout wrapper that includes the sidebar navigation and header.
 * Provides consistent structure across all pages.
 */

import React from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Receipt,
  Package,
  Droplet,
  DollarSign,
  Lightbulb,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

/**
 * Navigation items configuration
 */
const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/daily-log', label: 'Daily Log', icon: ClipboardList },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/billing', label: 'Billing', icon: Receipt },
  { path: '/stock', label: 'Stock', icon: Package },
];

/**
 * Layout Component
 */
const Layout: React.FC = () => {
  const location = useLocation();
  const { settings } = useSettings();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar-dark shadow-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className="flex items-center gap-3 border-b border-gray-700/50 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600">
              <Droplet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white">
                Daily Dairy
              </h1>
              <span className="text-sm text-blue-400">Manager</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 h-full w-1 rounded-r-full bg-white"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Pro Tip Section */}
          <div className="mx-3 mb-4 rounded-lg bg-sidebar-hover p-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Lightbulb className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Pro Tip</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              Update your stock daily to track leakage and ensure accurate billing.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-64 flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white px-8 py-4">
          <div className="flex items-center justify-end gap-4">
            {/* Currency Indicator */}
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50">
              <DollarSign className="h-4 w-4" />
              <span>Currency ({settings.currencySymbol})</span>
            </button>

            {/* User Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-50 text-sm font-semibold text-blue-600">
              O
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
