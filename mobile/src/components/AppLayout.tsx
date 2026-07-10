import React, { useState, useContext } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from './AppHeader';
import AppDrawer from './AppDrawer';
import { useTheme } from '../theme';
import { AuthContext } from '../context/AuthContext';

interface AppLayoutProps {
    title: string;
    children: React.ReactNode;
    iconPosition?: 'left' | 'right';
    rightAction?: React.ReactNode;
    menuDisabled?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
    title,
    children,
    iconPosition = 'left',
    rightAction,
    menuDisabled = false,
}) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { theme, isDark } = useTheme();
    const { logout } = useContext(AuthContext);

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
            
            <AppHeader 
                title={title} 
                onMenuPress={() => {
                    if (!menuDisabled) {
                        setIsDrawerOpen(true);
                    }
                }}
                iconPosition={iconPosition}
                rightAction={rightAction}
                menuDisabled={menuDisabled}
            />
            
            <View style={styles.content}>
                {children}
            </View>

            <AppDrawer 
                isVisible={isDrawerOpen} 
                onClose={() => setIsDrawerOpen(false)} 
                onLogout={logout}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    }
});

export default AppLayout;
