import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('unievents_lang');
    return saved === 'ro' || saved === 'en' ? saved : 'en';
  });

  const setLanguage = (nextLanguage) => {
    const safeLanguage = nextLanguage === 'ro' ? 'ro' : 'en';
    setLanguageState(safeLanguage);
    localStorage.setItem('unievents_lang', safeLanguage);
  };

  const t = (key, fallback = '') => {
    const keys = key.split('.');
    let val = translations[language];
    for (let k of keys) {
      if (val === undefined) break;
      val = val[k];
    }
    return val !== undefined ? val : (fallback || key);
  };

  const value = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key, fallback) => fallback || key
    };
  }
  return context;
};
