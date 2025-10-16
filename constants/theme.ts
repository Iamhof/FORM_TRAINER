export const COLORS = {
  background: 'rgb(0, 0, 0)',
  cardBackground: 'rgba(40, 20, 15, 0.6)',
  cardBorder: 'rgba(80, 40, 30, 0.3)',
  textPrimary: 'rgb(255, 255, 255)',
  textSecondary: 'rgb(153, 153, 153)',
  textTertiary: 'rgb(100, 100, 100)',
  
  accents: {
    orange: 'rgb(255, 107, 85)',
    purple: 'rgb(178, 102, 255)',
    blue: 'rgb(102, 153, 255)',
    red: 'rgb(244, 67, 54)',
    yellow: 'rgb(255, 193, 7)',
    green: 'rgb(76, 175, 80)',
    teal: 'rgb(0, 150, 136)',
    pink: 'rgb(236, 64, 122)',
  },
  
  success: 'rgb(76, 175, 80)',
  warning: 'rgb(255, 152, 0)',
  error: 'rgb(244, 67, 54)',
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

export type AccentColor = keyof typeof COLORS.accents;
