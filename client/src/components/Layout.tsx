/**
 * Layout Component
 * 
 * Main layout wrapper using Ant Design components.
 */

import React, { useState } from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Avatar, Typography } from 'antd';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Receipt,
  Package,
  Droplet,
  DollarSign,
} from 'lucide-react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useSettings } from '../contexts/SettingsContext';
import OnboardingTour from './OnboardingTour';

const { Header, Sider, Content } = AntLayout;
const { Title, Text } = Typography;

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { key: '/daily-log', icon: <ClipboardList size={18} />, label: 'Daily Log' },
    { key: '/customers', icon: <Users size={18} />, label: 'Customers' },
    { key: '/billing', icon: <Receipt size={18} />, label: 'Billing' },
    { key: '/stock', icon: <Package size={18} />, label: 'Stock' },
    { key: '/sources', icon: <MenuFoldOutlined size={18} />, data: { "menu-id": "/sources" }, label: 'Sources' }, 
  ];

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  // Determine active key from location
  const activeKey = location.pathname === '/' ? '/dashboard' : location.pathname;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        width={240}
        style={{ 
          background: '#FFFFFF', 
          borderRight: '1px solid #f0f0f0',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
        }}
        theme="light"
      >
        <div style={{ height: 64, margin: 16, display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <div style={{ 
            minWidth: 40, height: 40, 
            borderRadius: 8, 
            background: 'linear-gradient(135deg, #4285F4 0%, #1A73E8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white'
          }}>
            <Droplet size={24} />
          </div>
          {!collapsed && (
            <div>
              <Title level={5} style={{ margin: 0, color: '#1a73e8' }}>Dairy Manager</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Daily Operations</Text>
            </div>
          )}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems.map(item => ({
              ...item,
              'data-menu-id': item.key // Helper for Tour to find target
          }))}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
        
        {!collapsed && (
          <div style={{ position: 'absolute', bottom: 20, left: 16, right: 16 }}>
             <div style={{ background: '#E8F0FE', padding: 12, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1967D2', marginBottom: 4 }}>
                   <InfoCircleOutlined size={16} /> 
                   <Text strong style={{ color: '#1967D2', fontSize: 12 }}>PRO TIP</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Update stock daily to prevent inventory mismatches.
                </Text>
             </div>
          </div>
        )}
      </Sider>
      
      <AntLayout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 99 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined size={20} /> : <MenuFoldOutlined size={20} />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button icon={<DollarSign size={16} />} style={{ borderRadius: 20 }}>
               Currency ({settings.currencySymbol})
            </Button>
            <Avatar style={{ backgroundColor: '#e8f0fe', color: '#1a73e8' }}>O</Avatar>
          </div>
        </Header>
        
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          <Outlet />
          <OnboardingTour />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
