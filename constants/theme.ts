export const COLORS = {
  background: '#08080A',
  cardBackground: 'rgba(18, 18, 20, 0.8)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  textPrimary: 'rgb(255, 255, 255)',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textMuted: '#475569',

  accents: {
    orange: '#FF6B55',
    purple: '#A855F7',
    blue: '#6699FF',
    red: '#F44336',
    yellow: '#FFC107',
    green: '#22C55E',
    teal: '#009688',
    pink: '#EC407A',
  },

  success: '#22C55E',
  warning: '#FF9800',
  error: '#F44336',
} as const;

export const TYPOGRAPHY = {
  h1: {
    fontSize: 48,
    fontWeight: '800' as const,
    fontStyle: 'italic' as const,
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

export const NEON = {
  primary: '#FF7DFF',
  primaryDark: '#CC44CC',
  primaryLight: '#FFB3FF',

  glow: {
    border: {
      idle: 'rgba(255, 125, 255, 0.15)',
      focus: 'rgba(255, 125, 255, 0.6)',
    },
    shadow: {
      idle: 'rgba(255, 125, 255, 0.05)',
      focus: 'rgba(255, 125, 255, 0.35)',
    },
    radius: {
      idle: 4,
      focus: 16,
    },
  },

  chromatic: {
    red: '#FF3355',
    blue: '#3355FF',
    offsetX: 2,
    offsetY: 1,
  },

  gradient: {
    start: '#FF7DFF',
    end: '#CC44CC',
  },

  cardSurface: 'rgba(22, 22, 28, 0.9)',
} as const;

export const BOTTOM_NAV_HEIGHT = 60;

export type AccentColor = keyof typeof COLORS.accents;

/**
 * Converts a hex or rgb color string to an rgba string with the given opacity.
 */
export const colorWithOpacity = (color: string, alpha: number): string => {
  if (color.startsWith('rgb(')) {
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(0, 0, 0, ${alpha})`;
};
