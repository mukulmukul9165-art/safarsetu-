import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../translations/en.json';
import hi from '../translations/hi.json';
import nimadi from '../translations/nimadi.json';

const translations = { en, hi, nimadi };

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem('userLanguage');
      if (stored && translations[stored]) {
        setLocale(stored);
      }
    } catch (e) {
      console.error('Failed to load language', e);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLocale) => {
    if (translations[newLocale]) {
      setLocale(newLocale);
      try {
        await AsyncStorage.setItem('userLanguage', newLocale);
      } catch (e) {
        console.error('Failed to save language', e);
      }
    }
  };

  // Helper to get nested translation strings, e.g., t('hero.title')
  const t = (keyString) => {
    const keys = keyString.split('.');
    let current = translations[locale];
    
    for (const key of keys) {
      if (current === undefined || current === null) return keyString;
      current = current[key];
    }
    
    return current || keyString;
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
