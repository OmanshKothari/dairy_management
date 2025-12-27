import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#1a73e8', // Google Blue
    borderRadius: 8,
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    colorBgContainer: '#ffffff',
    colorTextHeading: '#202124',
    colorText: '#3c4043',
  },
  components: {
    Button: {
      controlHeight: 36,
      borderRadius: 18, // Pill shape buttons
      fontWeight: 500,
    },
    Card: {
      borderRadius: 12,
      boxShadowTertiary: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
    },
    Table: {
      borderRadius: 8,
    },
    Layout: {
      colorBgHeader: '#ffffff',
      colorBgBody: '#f8f9fa',
      colorBgTrigger: '#ffffff',
    }
  },
};

export default theme;
