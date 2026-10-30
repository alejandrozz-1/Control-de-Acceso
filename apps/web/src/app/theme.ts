import { createTheme } from '@mui/material/styles';

/** Tokens de marca Repsol (ver obsidianRepsol/04-Diseno-UX-UI.md) */
export const brand = {
  blue: '#041E42',
  orange: '#FF8200',
  red: '#E4002B',
  white: '#FFFFFF',
  ivory: '#F7F4EF',
  /** Degradado de cabecera estilo Waylet (ref. index.html del compañero) */
  gradient: 'linear-gradient(145deg, #FF8A00 0%, #FF5A00 45%, #E4002B 100%)',
} as const;

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' },
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
        primary: { main: brand.orange, contrastText: brand.blue },
        secondary: { main: '#FF5A00', contrastText: brand.white },
        error: { main: '#FF4D6A' },
        background: { default: '#07182B', paper: '#10243A' },
        text: { primary: '#F2F4F8', secondary: '#B6C5D8' },
        divider: '#263B53',
      },
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: (muiTheme) => ({
        '*::-webkit-scrollbar': {
          width: 10,
          height: 10,
        },
        '*::-webkit-scrollbar-button': {
          display: 'none',
          width: 0,
          height: 0,
          background: 'transparent',
        },
        '*::-webkit-scrollbar-button:single-button:vertical:decrement, *::-webkit-scrollbar-button:single-button:vertical:increment, *::-webkit-scrollbar-button:single-button:horizontal:decrement, *::-webkit-scrollbar-button:single-button:horizontal:increment': {
          display: 'none',
          width: 0,
          height: 0,
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: muiTheme.palette.background.paper,
        },
        '*::-webkit-scrollbar-thumb': {
          background: `linear-gradient(180deg, ${brand.orange}, ${brand.red})`,
          backgroundClip: 'padding-box',
          border: `3px solid ${muiTheme.palette.background.paper}`,
          borderRadius: 999,
        },
        '@supports not selector(::-webkit-scrollbar)': {
          '*': {
            scrollbarColor: `${muiTheme.palette.secondary.main} ${muiTheme.palette.background.paper}`,
            scrollbarWidth: 'thin',
          },
        },
      }),
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          // Feedback táctil al pulsar (ref. "tactile-btn" del index del compañero)
          transition: 'transform 0.08s ease, background-color 0.2s ease, border-color 0.2s ease',
          '&:active:not(:disabled)': { transform: 'scale(0.96)' },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: { label: { fontSize: '0.7rem' } },
    },
  },
});
