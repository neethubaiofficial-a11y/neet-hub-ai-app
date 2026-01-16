export const Colors = {
  // Dark theme (default)
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    primary: '#10B981',
    primaryDark: '#059669',
    accent: '#14B8A6',
    accentLight: '#5EEAD4',
    error: '#EF4444',
    errorDark: '#DC2626',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    border: '#334155',
    borderLight: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.dark;