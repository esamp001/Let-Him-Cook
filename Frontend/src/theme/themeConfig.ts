import type { ThemeConfig } from 'antd';

export const culinaryPalette = {
  primary: '#0D3B2E',
  primaryHover: '#134E4A',
  accent: '#EA580C',
  pageBackground: '#FAF9F6',
  surface: '#FFFFFF',
  surfaceMuted: '#EFECE6',
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textSubtle: '#9CA3AF',
  border: '#E5E7EB',
  borderSubtle: '#F3F4F6',
  success: '#15803D',
  successBackground: '#DCFCE7',
  successSurface: '#F0FDF4',
  warmSurface: '#F4EFE6',
  warmBorder: '#EAE3D5',
} as const;

export const culinaryTheme: ThemeConfig = {
  token: {
    colorPrimary: culinaryPalette.primary, // Deep forest green
    colorSuccess: '#16A34A',
    colorWarning: culinaryPalette.accent, // Culinary flame orange
    colorError: '#DC2626',
    colorInfo: culinaryPalette.primary,
    colorTextBase: culinaryPalette.text, // Dark slate / near-black
    colorBgBase: culinaryPalette.pageBackground, // Warm off-white
    borderRadius: 12,
    fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
  },
  components: {
    Button: {
      colorPrimary: culinaryPalette.primary,
      colorPrimaryHover: culinaryPalette.primaryHover,
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
      activeBorderColor: culinaryPalette.primary,
      hoverBorderColor: culinaryPalette.primaryHover,
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

