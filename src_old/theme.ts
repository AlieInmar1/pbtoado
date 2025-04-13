import { theme as baseTheme, createMultiStyleConfigHelpers } from '@chakra-ui/react';

// Color system from our design document
const colors = {
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5', // base
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  secondary: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488', // base
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
  success: '#059669',
  warning: '#D97706',
  error: '#E11D48',
  info: '#0284C7',
};

// Define our customized theme
const theme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    ...colors,
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
};

export default theme;
