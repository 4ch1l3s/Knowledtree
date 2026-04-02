import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, register as registerApi, LoginResponse, getCurrentUser, UserInfo, RegisterInput } from '../api/auth';
import { getMyAvatar, UserAvatarDto } from '../api/avatar';
import client from '../api/client';

interface AuthContextType {
    isLoading: boolean;
    userToken: string | null;
    userInfo: UserInfo | null;
    avatar: UserAvatarDto | null;
    setAvatar: React.Dispatch<React.SetStateAction<UserAvatarDto | null>>;
    login: (username: string, password: string) => Promise<void>;
    register: (input: RegisterInput) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [avatar, setAvatar] = useState<UserAvatarDto | null>(null);

    const login = async (username: string, password: string) => {
        try {
            const data: LoginResponse = await loginApi(username, password);
            if (data.access_token) {
                // 1. Gắn header cho các request Axios tiếp theo NGAY LẬP TỨC
                client.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;

                // 2. Lưu vào AsyncStorage
                await AsyncStorage.setItem('userToken', data.access_token);

                // 3. Fetch user info (khi đã có config header ở bước 1)
                try {
                    const user = await getCurrentUser();
                    setUserInfo(user);
                    await AsyncStorage.setItem('userInfo', JSON.stringify(user));
                } catch (userError) {
                    console.log('Failed to fetch user info', userError);
                }

                // 3b. Fetch avatar (dùng chung cho cả Profile và Drawer)
                try {
                    const avatarData = await getMyAvatar();
                    setAvatar(avatarData);
                } catch {
                    setAvatar(null);
                }

                // 4. Cập nhật state (Kích hoạt quá trình unmount Login, mount HomeScreen)
                setUserToken(data.access_token);
            }
        } catch (e) {
            console.log('Login error', e);
            throw e;
        }
    };

    const register = async (input: RegisterInput) => {
        await registerApi(input);
        // Auto-login after successful registration
        await login(input.userName, input.password);
    };

    const logout = async () => {
        setUserToken(null);
        setUserInfo(null);
        setAvatar(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        delete client.defaults.headers.common['Authorization'];
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let token = await AsyncStorage.getItem('userToken');
            let userInfoStr = await AsyncStorage.getItem('userInfo');

            if (token) {
                // 1. Gắn header trước khi cập nhật state
                client.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Refresh user info if token exists but userInfo doesn't
                if (!userInfoStr) {
                    try {
                        const user = await getCurrentUser();
                        setUserInfo(user);
                        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
                    } catch (userError) {
                        console.log('Failed to refresh user info', userError);
                    }
                } else {
                    setUserInfo(JSON.parse(userInfoStr));
                }

                // Fetch avatar khi khôi phục session
                try {
                    const avatarData = await getMyAvatar();
                    setAvatar(avatarData);
                } catch {
                    setAvatar(null);
                }
            }

            // 2. Kích hoạt render lại
            setUserToken(token);

        } catch (e) {
            console.log('IsLoggedIn error', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, register, logout, isLoading, userToken, userInfo, avatar, setAvatar }}>
            {children}
        </AuthContext.Provider>
    );
};
