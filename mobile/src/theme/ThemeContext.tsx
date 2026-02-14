import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, lightTheme, darkTheme } from './theme';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
    theme: Theme;
    themeMode: ThemeMode;
    isDark: boolean;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const STORAGE_KEY = 'app_theme_mode';

export const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const systemScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');

    const resolveTheme = (mode: ThemeMode): Theme => {
        if (mode === 'auto') {
            return systemScheme === 'dark' ? darkTheme : lightTheme;
        }
        return mode === 'dark' ? darkTheme : lightTheme;
    };

    const [theme, setTheme] = useState<Theme>(resolveTheme(themeMode));
    const isDark = theme.name === 'dark';

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
            if (saved === 'light' || saved === 'dark' || saved === 'auto') {
                setThemeModeState(saved);
            }
        });
    }, []);

    useEffect(() => {
        setTheme(resolveTheme(themeMode));
    }, [themeMode, systemScheme]);

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
        AsyncStorage.setItem(STORAGE_KEY, mode);
    };

    const toggleTheme = () => {
        setThemeMode(isDark ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

/**
 * Hook để dùng theme trong components
 * @example const { theme, isDark, toggleTheme } = useTheme();
 */
export const useTheme = () => useContext(ThemeContext);
