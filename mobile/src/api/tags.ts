import client from './client';

// DTO tag tra ve tu server
export interface TagDto {
    id: number;
    name: string;
    colorCode: string;
    creationTime: string;
}

// DTO tao/cap nhat tag
export interface CreateUpdateTagDto {
    name: string;
    colorCode: string;
}

// Lay danh sach tags cua user hien tai
export const getMyTags = async (): Promise<TagDto[]> => {
    const response = await client.get<TagDto[]>('/api/tags/my');
    return response.data;
};

// Tao tag moi
export const createTag = async (input: CreateUpdateTagDto): Promise<TagDto> => {
    const response = await client.post<TagDto>('/api/tags', input);
    return response.data;
};

// Cap nhat tag
export const updateTag = async (id: number, input: CreateUpdateTagDto): Promise<TagDto> => {
    const response = await client.put<TagDto>(`/api/tags/${id}`, input);
    return response.data;
};

// Xoa tag
export const deleteTag = async (id: number): Promise<void> => {
    await client.delete(`/api/tags/${id}`);
};
