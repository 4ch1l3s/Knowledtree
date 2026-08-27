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
        // Đọc cài đặt đã lưu trước khi cho phép bắt đầu phiên mới.
        // strictModeReady giúp màn Grow Tree không dùng nhầm giá trị mặc định trong lúc đang tải.
        AsyncStorage.getItem(STRICT_MODE_STORAGE_KEY)
            .then(storedValue => setStrictModeEnabledState(storedValue === 'true'))
            .catch(() => undefined)
            .finally(() => setStrictModeReady(true));
    }, []);

    const setStrictModeEnabled = useCallback((enabled: boolean) => {
        // Cập nhật giao diện ngay, sau đó lưu lựa chọn để lần mở app tiếp theo vẫn giữ nguyên.
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
