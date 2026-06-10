import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.joyvent.app',
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
    },
    GoogleAuth: {
      scopes: ["profile", "email"],
      clientId: "1046359789271-uv3c0lmtp77tq29st4bng4kovt1b4urf.apps.googleusercontent.com",
      forceCodeForRefreshToken: true
    }
  }
};

export default config;