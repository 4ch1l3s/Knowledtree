import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TextStyle } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';

const LoginScreen = () => {
    // ── Quản lý state form đăng nhập ──
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { login } = useContext(AuthContext);
    const { theme } = useTheme();

    // ── Xử lý đăng nhập: gọi AuthContext.login, bắt lỗi hiển thị ──
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

    // ── Style động: dùng theme tokens đã responsive tự động ──
    const dynamicStyles = {
        // Bố cục toàn màn hình, căn giữa nội dung
        container: {
            flex: 1,
            justifyContent: 'center' as const,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.background,
        },
        // Card chứa form đăng nhập
        card: {
            padding: theme.spacing.xl,
            borderRadius: theme.borderRadius.xl,
            backgroundColor: theme.colors.surface,
            ...theme.shadows.lg,
        },
        // Tiêu đề app
        title: {
            fontSize: theme.typography.fontSizeXxl,
            fontWeight: theme.typography.fontWeightBold as TextStyle['fontWeight'],
            marginBottom: theme.spacing.sm,
            textAlign: 'center' as const,
            color: theme.colors.primary,
        },
        // Phụ đề hướng dẫn
        subtitle: {
            fontSize: theme.typography.fontSizeMd,
            marginBottom: theme.spacing.xl,
            textAlign: 'center' as const,
            color: theme.colors.textSecondary,
        },
        // Nhóm label + input
        inputContainer: {
            marginBottom: scale.vs(20),
        },
        // Nhãn trường nhập
        label: {
            fontSize: theme.typography.fontSizeSm,
            fontWeight: '600' as TextStyle['fontWeight'],
            marginBottom: theme.spacing.sm,
            color: theme.colors.text,
        },
        // Ô nhập liệu
        input: {
            borderWidth: 1,
            paddingVertical: scale.vs(14),
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.borderRadius.lg,
            fontSize: theme.typography.fontSizeMd,
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: theme.colors.border,
            color: theme.colors.text,
        },
        // Khung hiển thị lỗi đăng nhập
        errorContainer: {
            padding: theme.spacing.md - scale.s(4),
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.md,
            backgroundColor: theme.colors.errorLight,
        },
        errorText: {
            fontSize: theme.typography.fontSizeSm,
            textAlign: 'center' as const,
            fontWeight: theme.typography.fontWeightMedium as TextStyle['fontWeight'],
            color: theme.colors.error,
        },
        // Nút đăng nhập
        button: {
            paddingVertical: theme.spacing.md,
            borderRadius: theme.borderRadius.lg,
            alignItems: 'center' as const,
            marginTop: theme.spacing.sm,
            backgroundColor: theme.colors.primary,
        },
        buttonText: {
            fontSize: theme.typography.fontSizeMd,
            fontWeight: theme.typography.fontWeightBold as TextStyle['fontWeight'],
            color: theme.colors.onPrimary,
        },
    };

    // ── Giao diện: form đăng nhập đơn giản ──
    return (
        <KeyboardAvoidingView
            style={dynamicStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={dynamicStyles.card}>
                {/* Tiêu đề và phụ đề */}
                <Text style={dynamicStyles.title}>Knowledtree</Text>
                <Text style={dynamicStyles.subtitle}>Đăng nhập vào tài khoản</Text>

                {/* Trường tên đăng nhập */}
                <View style={dynamicStyles.inputContainer}>
                    <Text style={dynamicStyles.label}>Tên đăng nhập</Text>
                    <TextInput
                        style={dynamicStyles.input}
                        value={username}
                        placeholder="Nhập tên đăng nhập"
                        placeholderTextColor={theme.colors.textTertiary}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        editable={!isSubmitting}
                    />
                </View>

                {/* Trường mật khẩu */}
                <View style={dynamicStyles.inputContainer}>
                    <Text style={dynamicStyles.label}>Mật khẩu</Text>
                    <TextInput
                        style={dynamicStyles.input}
                        value={password}
                        placeholder="Nhập mật khẩu"
                        placeholderTextColor={theme.colors.textTertiary}
                        onChangeText={setPassword}
                        secureTextEntry
                        editable={!isSubmitting}
                    />
                </View>

                {/* Thông báo lỗi (chỉ hiện khi có lỗi) */}
                {error && (
                    <View style={dynamicStyles.errorContainer}>
                        <Text style={dynamicStyles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Nút đăng nhập (hiện loading khi đang gửi) */}
                <TouchableOpacity
                    style={[dynamicStyles.button, isSubmitting && { opacity: 0.6 }]}
                    onPress={handleLogin}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={theme.colors.onPrimary} />
                    ) : (
                        <Text style={dynamicStyles.buttonText}>Đăng nhập</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;
