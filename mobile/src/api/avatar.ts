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
            '/api/app/user-avatar/my-avatar'
        );
        return response.data;
    } catch {
        // Trả về null nếu chưa có avatar
        return null;
    }
};
