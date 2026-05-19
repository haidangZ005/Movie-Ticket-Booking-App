import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../i18n/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: async () => {},
  t: (key: string) => key,
});

const LANG_STORAGE_KEY = '@app_language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLangState] = useState('vi');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem(LANG_STORAGE_KEY);
        if (savedLang && translations[savedLang]) {
          setLangState(savedLang);
        }
      } catch (e) {
        console.log('Không thể tải ng?n ng?', e);
      } finally {
        setIsReady(true);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: string) => {
    if (translations[lang]) {
      setLangState(lang);
      try {
        await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch (e) {
        console.log('Không thể lưu ngôn ngữ', e);
      }
    }
  };

  const t = (key: string, params?: Record<string, string>) => {
    const dict = translations[language] || translations['en'];
    let value = dict[key] || translations['vi'][key] || translations['en'][key] || key;

    if (params) {
      Object.keys(params).forEach((p) => {
        value = value.replace(`{{${p}}}`, params[p]);
      });
    }

    return value;
  };

  if (!isReady) {
    return null; // Or a splash screen/loading indicator
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
