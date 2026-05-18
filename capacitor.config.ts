import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pocketnews.app',
  appName: 'Pocketnews',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    url: 'https://studio-7985035708-93893.web.app',
    allowNavigation: ['studio-7985035708-93893.web.app'],
  },
};

export default config;
