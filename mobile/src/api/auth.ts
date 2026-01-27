import client from './client';
import qs from 'qs';

export interface LoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    id_token?: string;
    refresh_token?: string;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
    const data = qs.stringify({
        grant_type: 'password',
        client_id: 'Knowledtree_App',
        scope: 'offline_access Knowledtree',
        username: username,
        password: password,
    });

    const response = await client.post<LoginResponse>('/connect/token', data, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    return response.data;
};
