import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TranslationKey, translations } from './translations';

export type AppLanguage = 'en' | 'vi';
type TranslationParams = Record<string, string | number>;

interface LocalizationContextValue {
    language: AppLanguage;
    setLanguage: (language: AppLanguage) => void;
    t: (key: TranslationKey, params?: TranslationParams) => string;
}

const LANGUAGE_STORAGE_KEY = '@knowledtree/language';

const LocalizationContext = createContext<LocalizationContextValue | undefined>(undefined);

export const LocalizationProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguageState] = useState<AppLanguage>('en');

    useEffect(() => {
        AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
            .then(storedLanguage => {
                if (storedLanguage === 'en' || storedLanguage === 'vi') {
                    setLanguageState(storedLanguage);
                }
            })
            .catch(() => undefined);
    }, []);

    const setLanguage = useCallback((nextLanguage: AppLanguage) => {
        setLanguageState(nextLanguage);
        AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage).catch(() => undefined);
    }, []);

    const t = useCallback((key: TranslationKey, params?: TranslationParams) => {
        const template = translations[language][key] ?? translations.en[key] ?? key;

        if (!params) {
            return template;
        }

        return Object.entries(params).reduce(
            (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value)),
            template,
        );
    }, [language]);

    const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

    return (
        <LocalizationContext.Provider value={value}>
            {children}
        </LocalizationContext.Provider>
    );
};

export const useLocalization = () => {
    const context = useContext(LocalizationContext);

    if (!context) {
        throw new Error('useLocalization must be used inside LocalizationProvider');
    }

    return context;
};
