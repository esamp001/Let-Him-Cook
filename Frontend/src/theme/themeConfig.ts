import type { ThemeConfig } from 'antd';

export const culinaryTheme: ThemeConfig = {
  token: {
    colorPrimary: '#0D3B2E', // Deep forest green
    colorSuccess: '#16A34A',
    colorWarning: '#EA580C', // Culinary flame orange
    colorError: '#DC2626',
    colorInfo: '#0D3B2E',
    colorTextBase: '#111827', // Dark slate / near-black
    colorBgBase: '#FAF9F6', // Warm off-white
    borderRadius: 12,
    fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
  },
  components: {
    Button: {
      colorPrimary: '#0D3B2E',
      colorPrimaryHover: '#134E4A',
      colorPrimaryActive: '#08261D',
      borderRadius: 9999,
      controlHeight: 44,
      fontWeight: 600,
    },
    Input: {
      borderRadius: 9999,
      colorBgContainer: '#FFFFFF',
      colorBorder: '#E5E7EB',
      controlHeight: 52,
      activeBorderColor: '#0D3B2E',
      hoverBorderColor: '#134E4A',
    },
    Card: {
      borderRadiusLG: 16,
      colorBgContainer: '#FFFFFF',
      colorBorderSecondary: '#F3F4F6',
    },
    Tag: {
      borderRadiusSM: 9999,
    },
  },
};

