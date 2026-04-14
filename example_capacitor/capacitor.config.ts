import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pushwoosh.demovoip',
  appName: 'PW Capacitor VoIP Demo',
  webDir: 'www',
  android: {
    path: 'android',
  },
  cordova: {
    preferences: {
      LOG_LEVEL: 'DEBUG',
      ANDROID_FOREGROUND_PUSH: 'true',
    },
  },
};

export default config;
