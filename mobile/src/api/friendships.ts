import client from './client';

export type FriendshipStatus = 0 | 1;

export interface FriendshipDto {
    id: string;
    userId: string;
    friendId: string;
    status: FriendshipStatus;
    creationTime: string;
    lastModificationTime?: string | null;
    otherUserId: string;
    otherUserName: string;
    otherUserDisplayName: string;
    otherUserInitials: string;
    otherUserAvatarBase64Content?: string | null;
    otherUserAvatarContentType?: string | null;
}

export interface PagedResultDto<T> {
    totalCount: number;
    items: T[];
}

export interface FriendshipPageInput {
    skipCount: number;
    maxResultCount: number;
}

const getPaged = async (url: string, input: FriendshipPageInput): Promise<PagedResultDto<FriendshipDto>> => {
    const response = await client.get<PagedResultDto<FriendshipDto>>(url, {
        params: input,
    });
    return response.data;
};

export const getFriends = async (input: FriendshipPageInput): Promise<PagedResultDto<FriendshipDto>> =>
    getPaged('/api/friendships/friends', input);

export const getFriendRequests = async (input: FriendshipPageInput): Promise<PagedResultDto<FriendshipDto>> =>
    getPaged('/api/friendships/requests', input);

export const getPendingFriends = async (input: FriendshipPageInput): Promise<PagedResultDto<FriendshipDto>> =>
    getPaged('/api/friendships/pending', input);

export const acceptFriendRequest = async (id: string): Promise<FriendshipDto> => {
    const response = await client.post<FriendshipDto>(`/api/friendships/${id}/accept`);
    return response.data;
};

export const declineFriendRequest = async (id: string): Promise<void> => {
    await client.post(`/api/friendships/${id}/decline`);
};

export const cancelFriendRequest = async (id: string): Promise<void> => {
    await client.post(`/api/friendships/${id}/cancel`);
};

export const unfriend = async (id: string): Promise<void> => {
    await client.delete(`/api/friendships/${id}`);
};
