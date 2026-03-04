import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextStyle,
} from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { useTheme } from '../theme';
import { uploadMyAvatar, UserAvatarDto } from '../api/avatar';
import { scale } from '../utils/scale';

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
    const [isUploading, setIsUploading] = useState(false);

    const avatarSize = size ?? scale.s(80);
    const initials = displayName.charAt(0).toUpperCase();

    const handlePickImage = async () => {
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
                    'Lỗi',
                    'Không thể upload ảnh đại diện. Vui lòng thử lại.'
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
            Alert.alert('Lỗi', 'Không thể mở thư viện ảnh.');
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
                        <Text style={overlayTextStyle}>Sửa</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

export default AvatarPicker;
