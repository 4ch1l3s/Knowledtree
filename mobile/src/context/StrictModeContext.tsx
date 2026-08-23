import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STRICT_MODE_STORAGE_KEY = '@knowledtree/strictModeEnabled';

interface StrictModeContextValue {
    strictModeEnabled: boolean;
    strictModeReady: boolean;
    setStrictModeEnabled: (enabled: boolean) => void;
}

const StrictModeContext = createContext<StrictModeContextValue | undefined>(undefined);

export const StrictModeProvider = ({ children }: { children: React.ReactNode }) => {
    const [strictModeEnabled, setStrictModeEnabledState] = useState(false);
    const [strictModeReady, setStrictModeReady] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(STRICT_MODE_STORAGE_KEY)
            .then(storedValue => setStrictModeEnabledState(storedValue === 'true'))
            .catch(() => undefined)
            .finally(() => setStrictModeReady(true));
    }, []);

    const setStrictModeEnabled = useCallback((enabled: boolean) => {
        setStrictModeEnabledState(enabled);
        AsyncStorage.setItem(STRICT_MODE_STORAGE_KEY, String(enabled)).catch(() => undefined);
    }, []);

    const value = useMemo(() => ({
        strictModeEnabled,
        strictModeReady,
        setStrictModeEnabled,
    }), [strictModeEnabled, strictModeReady, setStrictModeEnabled]);

    return (
        <StrictModeContext.Provider value={value}>
            {children}
        </StrictModeContext.Provider>
    );
};

export const useStrictMode = () => {
    const context = useContext(StrictModeContext);

    if (!context) {
        throw new Error('useStrictMode must be used inside StrictModeProvider');
    }

    return context;
};
