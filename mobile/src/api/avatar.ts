import client from './client';

// DTO ảnh đại diện trả về từ server
export interface UserAvatarDto {
    base64Content: string;
    contentType: string;
}

// Lấy ảnh đại diện của người dùng hiện tại
export const getMyAvatar = async (): Promise<UserAvatarDto | null> => {
    try {
        const response = await client.get<UserAvatarDto>(
            '/api/user-avatar/my/json'
        );
        return response.data;
    } catch (error: any) {
        // Chỉ trả null khi server trả 404 (chưa có avatar)
        if (error?.response?.status === 404) {
            return null;
        }
        // Các lỗi khác (network, 5xx, 401...) phải được propagate
        throw error;
    }
};

// Upload hoặc thay thế ảnh đại diện của người dùng hiện tại
export const uploadMyAvatar = async (
    base64Content: string,
    contentType: string
): Promise<UserAvatarDto> => {
    const response = await client.post<UserAvatarDto>(
        '/api/user-avatar/upload/mobile',
        {
            base64Content,
            contentType,
            processOnServer: false,
        }
    );
    return response.data;
};
