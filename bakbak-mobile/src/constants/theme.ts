export const theme = {
  colors: {
    primary: {
      start: '#FF7A3D',
      end: '#FFB26A',
      gradient: ['#FF7A3D', '#FFB26A'],
    },
    secondary: {
      light: '#F8F9FA',
      dark: '#6C757D',
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F8F9FA',
      dark: '#1A1A1A',
    },
    text: {
      primary: '#212529',
      secondary: '#6C757D',
      inverse: '#FFFFFF',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.2)',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    status: {
      success: '#28A745',
      error: '#DC3545',
      warning: '#FFC107',
      info: '#17A2B8',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;
