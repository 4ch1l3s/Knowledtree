import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../theme';

const HomeScreen = () => {
    const { logout, userInfo } = useContext(AuthContext);
    const { theme, isDark, toggleTheme } = useTheme();

    // Lấy tên hiển thị: ưu tiên name, nếu không có thì dùng userName
    const displayName = userInfo?.name || userInfo?.userName || 'Người dùng';

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.card, { backgroundColor: theme.colors.surface }, theme.shadows.md]}>
                <Text style={[styles.greeting, { color: theme.colors.text }]}>
                    Xin chào,
                </Text>
                <Text style={[styles.name, { color: theme.colors.primary }]}>
                    {displayName}!
                </Text>
                {userInfo?.email && (
                    <Text style={[styles.email, { color: theme.colors.textSecondary }]}>
                        {userInfo.email}
                    </Text>
                )}
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={toggleTheme}
            >
                <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
                    {isDark ? '☀️ Chế độ sáng' : '🌙 Chế độ tối'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.logoutButton, {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                }]}
                onPress={logout}
            >
                <Text style={[styles.buttonText, { color: theme.colors.error }]}>
                    Đăng xuất
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 18,
        fontWeight: '400',
        marginBottom: 4,
    },
    name: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
    },
    email: {
        fontSize: 14,
        marginTop: 8,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    logoutButton: {
        borderWidth: 1,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default HomeScreen;
