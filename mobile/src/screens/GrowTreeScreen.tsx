import React from 'react';
import { View, Text, TextStyle } from 'react-native';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';
import AppLayout from '../components/AppLayout';

const GrowTreeScreen = () => {
    const { theme } = useTheme();

    const dynamicStyles = {
        container: {
            flex: 1,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.background,
        },
        message: {
            fontSize: theme.typography.fontSizeLg,
            fontWeight: theme.typography.fontWeightMedium as TextStyle['fontWeight'],
            color: theme.colors.textSecondary,
        }
    };

    return (
        <AppLayout title="Grow a tree" iconPosition="left">
            <View style={dynamicStyles.container}>
                <Text style={dynamicStyles.message}>Trang "Grow a tree" đang được xây dựng...</Text>
            </View>
        </AppLayout>
    );
};

export default GrowTreeScreen;
