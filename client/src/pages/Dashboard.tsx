/**
 * Dashboard Page
 * 
 * Main dashboard showing overview statistics, weekly delivery chart,
 * and quick actions for common tasks using Ant Design.
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
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Droplet,
  DollarSign,
  Users,
  AlertTriangle,
  UserPlus,
  Package,
  FileText,
} from 'lucide-react';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Card, Statistic, Row, Col, Button, Spin, Typography, Alert, Space } from 'antd';
import { useSettings } from '../contexts/SettingsContext';
import { dashboardApi } from '../services/api';
import { DashboardStats, YesterdayComparison } from '../types';
import { getGreeting, getCurrentShift } from '../utils/helpers';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '0 8px' }}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: 24 }}
      >
        <Card
          style={{ 
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=1200&h=400&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'white',
            border: 'none',
          }}
          bodyStyle={{ padding: '48px 32px' }}
        >
          <Title level={1} style={{ color: 'white', margin: 0 }}>
            {getGreeting()}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, marginTop: 8, display: 'block' }}>
            Ready for today's distribution? You have{' '}
            <Text strong style={{ color: '#4285F4' }}>
              {stats?.pendingDeliveries || 0}
            </Text>{' '}
            pending deliveries for the {currentShift} shift.
          </Text>
          <Link to="/daily-log">
            <Button type="primary" size="large" style={{ marginTop: 24, paddingLeft: 32, paddingRight: 32 }}>
              Start Delivery Run <ArrowRightOutlined />
            </Button>
          </Link>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Droplet size={20} color="#1890ff" /> Total Milk Today</span>}
              value={stats?.totalMilkToday}
              precision={1}
              suffix="L"
              valueStyle={{ color: '#3f8600' }}
            />
            {comparison && (
               <Text type={comparison.percentageChange >= 0 ? "success" : "danger"} style={{ fontSize: 12 }}>
                 {comparison.percentageChange >= 0 ? '+' : ''}{comparison.percentageChange}% vs yesterday
               </Text>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign size={20} color="#faad14" /> Est. Revenue</span>}
              value={stats?.estimatedRevenueToday}
              precision={2}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable>
            <Statistic
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={20} color="#52c41a" /> Active Customers</span>}
              value={stats?.activeCustomers}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} hoverable>
             <Statistic
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={20} color="#ff4d4f" /> Stock Status</span>}
              value=" "
              prefix={
                 <Alert
                    message={stats?.lowStockAlert ? "Low Stock" : "Sufficient"}
                    type={stats?.lowStockAlert ? "error" : "success"}
                    showIcon
                    style={{ padding: '4px 12px', borderRadius: 16, border: 'none', background: stats?.lowStockAlert ? '#fff2f0' : '#f6ffed' }}
                 />
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Charts and Quick Actions */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Weekly Delivery Overview" bordered={false}>
            <div style={{ height: 300 }}>
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
                  <RechartsTooltip
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
                    fill="#1890ff" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quick Actions" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Link to="/customers?action=add">
                <Button block size="large" icon={<UserPlus size={18} />} style={{ textAlign: 'left', height: 50, display: 'flex', alignItems: 'center' }}>
                  Add New Customer
                </Button>
              </Link>
              <Link to="/stock">
                 <Button block size="large" icon={<Package size={18} />} style={{ textAlign: 'left', height: 50, display: 'flex', alignItems: 'center' }}>
                  Record Stock In
                </Button>
              </Link>
              <Link to="/billing">
                 <Button block size="large" icon={<FileText size={18} />} style={{ textAlign: 'left', height: 50, display: 'flex', alignItems: 'center' }}>
                  Send Monthly Bill
                </Button>
              </Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
