import { createTheme } from '@mui/material/styles';

/** Tokens de marca Repsol (ver obsidianRepsol/04-Diseno-UX-UI.md) */
export const brand = {
  blue: '#041E42',
  orange: '#FF8200',
  red: '#E4002B',
  white: '#FFFFFF',
  ivory: '#F7F4EF',
} as const;

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: { main: brand.blue, contrastText: brand.white },
        secondary: { main: brand.orange, contrastText: brand.blue },
        error: { main: brand.red },
        background: { default: brand.white, paper: brand.ivory },
        text: { primary: '#0A1633' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#5B8DEF', contrastText: brand.blue },
        secondary: { main: brand.orange, contrastText: brand.blue },
        error: { main: '#FF4D6A' },
        background: { default: '#0B1220', paper: '#111A2C' },
        text: { primary: '#F2F4F8' },
      },
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiBottomNavigationAction: {
      styleOverrides: { label: { fontSize: '0.7rem' } },
    },
  },
});
