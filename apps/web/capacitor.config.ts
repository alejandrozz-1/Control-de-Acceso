import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.repsol.controlacceso',
  appName: 'Control de Acceso',
  webDir: 'dist',
  server: { androidScheme: 'https' },
};

export default config;
