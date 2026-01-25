export const COLORS = {
  background: 'rgb(0, 0, 0)',
  cardBackground: 'rgba(40, 20, 15, 0.6)',
  cardBorder: 'rgba(80, 40, 30, 0.3)',
  textPrimary: 'rgb(255, 255, 255)',
  textSecondary: 'rgb(170, 170, 170)',
  textTertiary: 'rgb(120, 120, 120)',
  textMuted: 'rgb(100, 100, 100)',
  
  accents: {
    orange: '#FF6B55',
    purple: '#B266FF',
    blue: '#6699FF',
    red: '#F44336',
    yellow: '#FFC107',
    green: '#4CAF50',
    teal: '#009688',
    pink: '#EC407A',
  },
  
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
} as const;

export const TYPOGRAPHY = {
  h1: {
    fontSize: 48,
    fontWeight: '800' as const,
  },
  h2: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BOTTOM_NAV_HEIGHT = 60;

export type AccentColor = keyof typeof COLORS.accents;
