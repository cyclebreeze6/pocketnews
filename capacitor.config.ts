import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pocketnews.app',
  appName: 'Pocketnews',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    url: 'https://pocketstream.tv',
    allowNavigation: ['pocketstream.tv'],
  },
};

export default config;
