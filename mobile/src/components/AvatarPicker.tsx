import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    PermissionsAndroid,
    TextStyle,
} from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { useTheme } from '../theme';
import { uploadMyAvatar, UserAvatarDto } from '../api/avatar';
import { scale } from '../utils/scale';
import { useLocalization } from '../localization';

/** Xin quyền truy cập thư viện ảnh trên Android (runtime permission) */
const requestGalleryPermission = async (copy: {
    title: string;
    message: string;
    allow: string;
    deny: string;
}): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    const permission =
        Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

    const status = await PermissionsAndroid.request(permission, {
        title: copy.title,
        message: copy.message,
        buttonPositive: copy.allow,
        buttonNegative: copy.deny,
    });

    return status === PermissionsAndroid.RESULTS.GRANTED;
};

interface AvatarPickerProps {
    /** Avatar hiện tại (null = chưa có) */
    avatar: UserAvatarDto | null;
    /** Tên hiển thị (dùng cho placeholder chữ cái đầu) */
    displayName: string;
    /** Kích thước avatar (px) */
    size?: number;
    /** Callback khi avatar thay đổi thành công */
    onAvatarChanged: (newAvatar: UserAvatarDto) => void;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({
    avatar,
    displayName,
    size,
    onAvatarChanged,
}) => {
    const { theme } = useTheme();
    const { t } = useLocalization();
    const [isUploading, setIsUploading] = useState(false);

    const avatarSize = size ?? scale.s(80);
    const initials = displayName.charAt(0).toUpperCase();

    const handlePickImage = async () => {
        // Xin quyền truy cập thư viện ảnh trước khi mở picker
        const hasPermission = await requestGalleryPermission({
            title: t('avatar.permissionTitle'),
            message: t('avatar.permissionMessage'),
            allow: t('avatar.allow'),
            deny: t('avatar.deny'),
        });
        if (!hasPermission) {
            Alert.alert(
                t('avatar.permissionTitle'),
                t('avatar.permissionMessage'),
            );
            return;
        }

        try {
            const image = await ImageCropPicker.openPicker({
                width: 250,
                height: 250,
                cropping: true,
                cropperCircleOverlay: true,
                compressImageQuality: 0.8,
                includeBase64: true,
                mediaType: 'photo',
            });

            if (!image.data || !image.mime) {
                return;
            }

            setIsUploading(true);
            try {
                const result = await uploadMyAvatar(image.data, image.mime);
                onAvatarChanged(result);
            } catch (uploadError) {
                Alert.alert(
                    t('common.error'),
                    t('avatar.uploadError'),
                );
                console.error('Avatar upload failed:', uploadError);
            } finally {
                setIsUploading(false);
            }
        } catch (pickerError: any) {
            // User hủy chọn ảnh → không làm gì
            if (pickerError?.code === 'E_PICKER_CANCELLED') {
                return;
            }
            Alert.alert(t('common.error'), t('avatar.openError'));
            console.error('Image picker error:', pickerError);
        }
    };

    const containerStyle = {
        width: avatarSize,
        height: avatarSize,
        borderRadius: avatarSize / 2,
        overflow: 'hidden' as const,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    };

    const imageStyle = {
        width: avatarSize,
        height: avatarSize,
    };

    const initialsStyle = {
        fontSize: scale.ms(32),
        fontWeight: theme.typography.fontWeightBold as TextStyle['fontWeight'],
        color: theme.colors.onPrimary,
    };

    const overlayStyle = {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        height: avatarSize * 0.3,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    };

    const overlayTextStyle = {
        color: '#FFFFFF',
        fontSize: scale.ms(10),
        fontWeight: '600' as TextStyle['fontWeight'],
    };

    return (
        <TouchableOpacity
            onPress={handlePickImage}
            disabled={isUploading}
            activeOpacity={0.7}
        >
            <View style={containerStyle}>
                {isUploading ? (
                    <ActivityIndicator size="large" color={theme.colors.onPrimary} />
                ) : avatar ? (
                    <Image
                        source={{
                            uri: `data:${avatar.contentType};base64,${avatar.base64Content}`,
                        }}
                        style={imageStyle}
                    />
                ) : (
                    <Text style={initialsStyle}>{initials}</Text>
                )}

                {/* Overlay "Sửa" khi không đang upload */}
                {!isUploading && (
                    <View style={overlayStyle}>
                        <Text style={overlayTextStyle}>{t('avatar.edit')}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

export default AvatarPicker;
