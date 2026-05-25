import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Image } from 'react-native';

// Khai báo sẵn đường dẫn ảnh để preload
const heroImage = require('./src/assets/images/hero.png');

export default function App() {
  useEffect(() => {
    // Ép React Native đưa ảnh vào RAM ngay lập tức khi mở App
    const imageUri = Image.resolveAssetSource(heroImage).uri;
    Image.prefetch(imageUri).catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
