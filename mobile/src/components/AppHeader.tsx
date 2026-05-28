import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextStyle } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';

interface AppHeaderProps {
    title: string;
    onMenuPress: () => void;
    iconPosition?: 'left' | 'right';
    rightAction?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, onMenuPress, iconPosition = 'left', rightAction }) => {
    const { theme } = useTheme();

    // From the design: title and icon use a dark green color 
    const headerColor = theme.colors.primaryDark;

    const renderMenuButton = () => (
        <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
            <FontAwesome name="navicon" size={scale.ms(22)} color={headerColor} />
        </TouchableOpacity>
    );

    const renderPlaceholder = () => (
        <View style={styles.iconButton} />
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {iconPosition === 'left' ? renderMenuButton() : renderPlaceholder()}
            
            <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: headerColor, fontWeight: theme.typography.fontWeightMedium as TextStyle['fontWeight'] }]}>
                    {title}
                </Text>
            </View>

            {rightAction ? (
                <View style={styles.iconButton}>
                    {rightAction}
                </View>
            ) : (
                iconPosition === 'right' ? renderMenuButton() : renderPlaceholder()
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale.s(16),
        paddingVertical: scale.vs(12),
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: scale.ms(18),
    },
    iconButton: {
        width: scale.s(40),
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default AppHeader;
