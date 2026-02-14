import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../theme';

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const { theme } = useTheme();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await login(username, password);
        } catch (e: any) {
            const errorMessage = e.response?.data?.error_description || e.message || 'Lỗi không xác định';
            setError(errorMessage);
            console.error('Login Error Details:', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={[styles.card, { backgroundColor: theme.colors.surface }, theme.shadows.lg]}>
                <Text style={[styles.title, { color: theme.colors.primary }]}>
                    🌿 Knowledtree
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    Đăng nhập vào tài khoản
                </Text>

                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>Tên đăng nhập</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.colors.backgroundSecondary,
                            borderColor: theme.colors.border,
                            color: theme.colors.text,
                        }]}
                        value={username}
                        placeholder="Nhập tên đăng nhập"
                        placeholderTextColor={theme.colors.textTertiary}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        editable={!isSubmitting}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>Mật khẩu</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.colors.backgroundSecondary,
                            borderColor: theme.colors.border,
                            color: theme.colors.text,
                        }]}
                        value={password}
                        placeholder="Nhập mật khẩu"
                        placeholderTextColor={theme.colors.textTertiary}
                        onChangeText={setPassword}
                        secureTextEntry
                        editable={!isSubmitting}
                    />
                </View>

                {error && (
                    <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorLight }]}>
                        <Text style={[styles.error, { color: theme.colors.error }]}>
                            ⚠️ {error}
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: theme.colors.primary },
                        isSubmitting && { opacity: 0.6 }
                    ]}
                    onPress={handleLogin}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={theme.colors.onPrimary} />
                    ) : (
                        <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
                            Đăng nhập
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        padding: 32,
        borderRadius: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        fontSize: 16,
    },
    errorContainer: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    error: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    button: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

export default LoginScreen;
