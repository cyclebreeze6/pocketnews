import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pocketnews.app',
  appName: 'Pocketnews',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    url: 'https://studio-593957916-4e99b.web.app',
    allowNavigation: ['studio-593957916-4e99b.web.app'],
  },
};

export default config;
