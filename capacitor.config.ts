import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hhimeal.app',
  appName: 'HD현대 식단 앱',
  webDir: 'public',
  server: {
    url: 'https://www.hhimeal.com',
    cleartext: false
  }
};

export default config;
