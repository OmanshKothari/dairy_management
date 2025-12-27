/**
 * Dashboard Page
 * 
 * Main dashboard showing overview statistics, weekly delivery chart,
 * and quick actions for common tasks.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Droplet,
  DollarSign,
  Users,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  Package,
  Send,
  TrendingUp,
  TrendingDown,
  CheckCircle,
} from 'lucide-react';
import { Card, LoadingSpinner, Button } from '../components/ui';
import { useSettings } from '../contexts/SettingsContext';
import { dashboardApi } from '../services/api';
import { DashboardStats, YesterdayComparison } from '../types';
import { getGreeting, getCurrentShift } from '../utils/helpers';
import toast from 'react-hot-toast';

/**
 * Stat Card Component
 */
interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  suffix?: string;
  trend?: { value: number; isPositive: boolean };
  alert?: { isAlert: boolean; message: string };
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconBg,
  label,
  value,
  suffix,
  trend,
  alert,
}) => (
  <Card className="relative overflow-hidden">
    <div className="flex items-start justify-between">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm font-medium ${
          trend.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend.isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>{trend.isPositive ? '+' : ''}{trend.value}% vs yest</span>
        </div>
      )}
      {alert && (
        <div className={`rounded-lg px-3 py-1.5 ${
          alert.isAlert ? 'bg-red-50' : 'bg-green-50'
        }`}>
          {alert.isAlert ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {suffix && <span className="text-lg text-gray-500">{suffix}</span>}
      </div>
      {alert && (
        <p className={`mt-1 text-sm ${alert.isAlert ? 'text-red-600' : 'text-green-600'}`}>
          {alert.message}
        </p>
      )}
    </div>
  </Card>
);

/**
 * Quick Action Item Component
 */
interface QuickActionProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50"
  >
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
        {icon}
      </div>
      <span className="font-medium text-gray-700">{label}</span>
    </div>
    <ArrowRight className="h-5 w-5 text-gray-400" />
  </Link>
);

/**
 * Dashboard Page Component
 */
const Dashboard: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [comparison, setComparison] = useState<YesterdayComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentShift = getCurrentShift();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [statsData, comparisonData] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getComparison(),
        ]);
        setStats(statsData);
        setComparison(comparisonData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card padding="none" className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=1200&h=400&fit=crop)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        <div className="relative px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl font-bold text-white">
              {getGreeting()}
            </h1>
            <p className="mt-2 text-lg text-gray-200">
              Ready for today's distribution? You have{' '}
              <span className="font-semibold text-blue-400">
                {stats?.pendingDeliveries || 0}
              </span>{' '}
              pending deliveries for the {currentShift} shift.
            </p>
            <Link to="/daily-log">
              <Button className="mt-6" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start Delivery Run
              </Button>
            </Link>
          </motion.div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            icon={<Droplet className="h-6 w-6 text-blue-600" />}
            iconBg="bg-blue-100"
            label="Total Milk Today"
            value={stats?.totalMilkToday.toFixed(1) || '0'}
            suffix="L"
            trend={comparison ? {
              value: comparison.percentageChange,
              isPositive: comparison.percentageChange >= 0,
            } : undefined}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            icon={<DollarSign className="h-6 w-6 text-yellow-600" />}
            iconBg="bg-yellow-100"
            label="Est. Revenue Today"
            value={formatCurrency(stats?.estimatedRevenueToday || 0)}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard
            icon={<Users className="h-6 w-6 text-green-600" />}
            iconBg="bg-green-100"
            label="Active Customers"
            value={stats?.activeCustomers || 0}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatCard
            icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
            iconBg="bg-red-100"
            label="Low Stock Alert"
            value=""
            alert={{
              isAlert: stats?.lowStockAlert || false,
              message: stats?.lowStockAlert 
                ? 'Stock running low!' 
                : 'Stock levels sufficient.',
            }}
          />
        </motion.div>
      </div>

      {/* Charts and Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Delivery Chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <h2 className="text-lg font-semibold text-gray-900">Weekly Delivery Overview</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.weeklyOverview || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                    formatter={(value: number) => [`${value} L`, 'Delivered']}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#3b82f6" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <div className="mt-4 space-y-3">
              <QuickAction
                to="/customers?action=add"
                icon={<UserPlus className="h-5 w-5" />}
                label="Add New Customer"
              />
              <QuickAction
                to="/stock"
                icon={<Package className="h-5 w-5" />}
                label="Record Stock In"
              />
              <QuickAction
                to="/billing"
                icon={<Send className="h-5 w-5" />}
                label="Send Monthly Bill"
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
