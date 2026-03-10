import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextStyle } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../theme';
import { getMyAvatar, UserAvatarDto } from '../api/avatar';
import { scale } from '../utils/scale';
import AvatarPicker from '../components/AvatarPicker';

const HomeScreen = () => {
    const { logout, userInfo } = useContext(AuthContext);
    const { theme, isDark, toggleTheme } = useTheme();

    // ── State ảnh đại diện ──
    const [avatar, setAvatar] = useState<UserAvatarDto | null>(null);

    // ── Tên hiển thị: ưu tiên name > userName > fallback ──
    const displayName = userInfo?.name || userInfo?.userName || 'Người dùng';

    // ── Lấy avatar khi component mount ──
    useEffect(() => {
        const fetchAvatar = async () => {
            try {
                const result = await getMyAvatar();
                setAvatar(result);
            } catch {
                // API lỗi → giữ avatar = null → hiện placeholder initials
                setAvatar(null);
            }
        };
        fetchAvatar();
    }, []);

    // ── Kích thước avatar ──
    const avatarSize = scale.s(80);

    // ── Style động: dùng theme tokens đã responsive tự động ──
    const dynamicStyles = {
        // Bố cục toàn màn hình, căn giữa nội dung
        container: {
            flex: 1,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.background,
        },
        // Card thông tin người dùng
        card: {
            width: '100%' as const,
            padding: theme.spacing.xl,
            borderRadius: theme.borderRadius.xl,
            alignItems: 'center' as const,
            marginBottom: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            ...theme.shadows.md,
        },
        // Khoảng cách dưới avatar
        avatarWrapper: {
            marginBottom: theme.spacing.md,
        },
        // Dòng chào "Xin chào,"
        greeting: {
            fontSize: theme.typography.fontSizeLg,
            fontWeight: theme.typography.fontWeightRegular as TextStyle['fontWeight'],
            marginBottom: theme.spacing.xs,
            color: theme.colors.text,
        },
        // Tên người dùng nổi bật
        name: {
            fontSize: theme.typography.fontSizeXxl,
            fontWeight: theme.typography.fontWeightBold as TextStyle['fontWeight'],
            marginBottom: theme.spacing.sm,
            color: theme.colors.primary,
        },
        // Email phụ
        email: {
            fontSize: theme.typography.fontSizeSm,
            marginTop: theme.spacing.sm,
            color: theme.colors.textSecondary,
        },
        // Style chung cho các nút bên dưới
        button: {
            width: '100%' as const,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.borderRadius.lg,
            alignItems: 'center' as const,
            marginBottom: theme.spacing.md - theme.spacing.xs,
        },
        buttonText: {
            fontSize: theme.typography.fontSizeMd,
            fontWeight: theme.typography.fontWeightMedium as TextStyle['fontWeight'],
        },
    };

    // ── Giao diện: avatar + thông tin user + nút chuyển theme + đăng xuất ──
    return (
        <View style={dynamicStyles.container}>
            {/* Card thông tin người dùng */}
            <View style={dynamicStyles.card}>
                {/* Ảnh đại diện — nhấn để thay đổi */}
                <View style={dynamicStyles.avatarWrapper}>
                    <AvatarPicker
                        avatar={avatar}
                        displayName={displayName}
                        size={avatarSize}
                        onAvatarChanged={(newAvatar) => setAvatar(newAvatar)}
                    />
                </View>

                <Text style={dynamicStyles.greeting}>{displayName} </Text>
                <Text style={dynamicStyles.name}> Alo, em có phải {displayName} không?</Text>
                {userInfo?.email && (
                    <Text style={dynamicStyles.email}>{userInfo.email}</Text>
                )}
            </View>

            {/* Nút chuyển đổi sáng/tối */}
            <TouchableOpacity
                style={[dynamicStyles.button, { backgroundColor: theme.colors.primary }]}
                onPress={toggleTheme}
            >
                <Text style={[dynamicStyles.buttonText, { color: theme.colors.onPrimary }]}>
                    {isDark ? 'Chế độ sáng' : 'Chế độ tối'}
                </Text>
            </TouchableOpacity>

            {/* Nút đăng xuất */}
            <TouchableOpacity
                style={[dynamicStyles.button, {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.primary,
                    borderWidth: 1,
                }]}
                onPress={logout}
            >
                <Text style={[dynamicStyles.buttonText, { color: theme.colors.error }]}>
                    Đăng xuất
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default HomeScreen;
