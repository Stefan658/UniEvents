import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('unievents_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('unievents_lang', language);
  }, [language]);

  const t = (key, fallback = '') => {
    const keys = key.split('.');
    let val = translations[language];
    for (let k of keys) {
      if (val === undefined) break;
      val = val[k];
    }
    return val !== undefined ? val : (fallback || key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
