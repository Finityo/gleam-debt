import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finityo.debt',
  appName: 'Finityo',
  webDir: 'dist', // Vite builds to 'dist' folder
  server: {
    // For live reload during development:
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#000000'
  }
};

export default config;
