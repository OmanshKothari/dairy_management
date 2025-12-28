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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
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
import { Card, Statistic, Row, Col, Button, Spin, Typography, Alert, Space, DatePicker, Select, Grid } from 'antd';
import { useSettings } from '../contexts/SettingsContext';
import { dashboardApi, customerApi } from '../services/api';
import { DashboardStats, YesterdayComparison, Customer } from '../types';
import { getGreeting, getCurrentShift } from '@/utils/helpers';
import toast from 'react-hot-toast';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// Colors for Pie Chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

/**
 * Dashboard Page Component
 */
const Dashboard: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [comparison, setComparison] = useState<YesterdayComparison | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [sourceStats, setSourceStats] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(30, 'days'), dayjs()]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');

  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const currentShift = getCurrentShift();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [statsData, comparisonData, customersList] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getComparison(),
          customerApi.getAll(undefined, true), // Get active customers
        ]);
        setStats(statsData);
        setComparison(comparisonData);
        setCustomers(customersList);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch reports when filters change
  useEffect(() => {
    const fetchReports = async () => {
        try {
            const [start, end] = dateRange;
            const startDate = start.format('YYYY-MM-DD');
            const endDate = end.format('YYYY-MM-DD');

            const [trendsData, sourcesData] = await Promise.all([
                dashboardApi.getDeliveryTrends(startDate, endDate, selectedCustomerId),
                dashboardApi.getSourceStats(startDate, endDate),
            ]);
            setTrends(trendsData);
            setSourceStats(sourcesData);
        } catch (error) {
            console.error('Failed to load report data:', error);
        }
    };

    if (dateRange && dateRange[0] && dateRange[1]) {
        fetchReports();
    }
  }, [dateRange, selectedCustomerId]);

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
          <Title level={isMobile ? 2 : 1} style={{ color: 'white', margin: 0 }}>
            {getGreeting()}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? 14 : 18, marginTop: 8, display: 'block' }}>
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

      {/* Charts Section */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col span={24}>
            <Card title={
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'flex-start' : 'center', 
                    flexDirection: isMobile ? 'column' : 'row',
                    padding: '8px 0',
                    gap: 12 
                }}>
                    <span>Analytics & Reports</span>
                    <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
                        <Select
                            value={selectedCustomerId}
                            onChange={setSelectedCustomerId}
                            style={{ width: isMobile ? '100%' : 200 }}
                            placeholder="Filter by Customer"
                        >
                            <Select.Option value="all">All Customers</Select.Option>
                            {customers.map(c => (
                                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                            ))}
                        </Select>
                        <RangePicker 
                            value={dateRange}
                            onChange={(dates) => {
                                if (dates && dates[0] && dates[1]) {
                                    setDateRange([dates[0], dates[1]]);
                                }
                            }}
                            allowClear={false}
                            style={{ width: isMobile ? '100%' : 'auto' }}
                        />
                    </Space>
                </div>
            } bordered={false}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <Title level={5}>Milk Distribution Trend</Title>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(val) => dayjs(val).format('MMM D')}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                />
                                <YAxis 
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                />
                                <RechartsTooltip
                                    labelFormatter={(val) => dayjs(val).format('MMMM D, YYYY')}
                                    formatter={(value: number) => [`${value} L`, 'Distributed']}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#1890ff" 
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 8 }}
                                />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Title level={5}>Source Contribution</Title>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {sourceStats.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Col>
                </Row>
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
