import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'mobile',
  webDir: 'www',
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: [
      '192.168.1.5:8000'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // Splash screen muncul selama 3 detik
      launchAutoHide: true,
      backgroundColor: "#ffffff", // Background putih biar cocok dengan logo
      androidScaleType: "CENTER_CROP"
    }
  }
};

export default config;