import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, LoginResponse, getCurrentUser, UserInfo } from '../api/auth';
import client from '../api/client';

interface AuthContextType {
    isLoading: boolean;
    userToken: string | null;
    userInfo: UserInfo | null;
    login: (username: string, password: string) => Promise<void>;
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

    const login = async (username: string, password: string) => {
        try {
            const data: LoginResponse = await loginApi(username, password);
            if (data.access_token) {
                setUserToken(data.access_token);
                await AsyncStorage.setItem('userToken', data.access_token);

                // Attach token to default client headers
                client.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;

                // Fetch user info after successful login
                try {
                    const user = await getCurrentUser();
                    setUserInfo(user);
                    await AsyncStorage.setItem('userInfo', JSON.stringify(user));
                } catch (userError) {
                    console.log('Failed to fetch user info', userError);
                }
            }
        } catch (e) {
            console.log('Login error', e);
            throw e;
        }
    };

    const logout = async () => {
        setUserToken(null);
        setUserInfo(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        delete client.defaults.headers.common['Authorization'];
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let token = await AsyncStorage.getItem('userToken');
            let userInfoStr = await AsyncStorage.getItem('userInfo');

            setUserToken(token);
            if (userInfoStr) {
                setUserInfo(JSON.parse(userInfoStr));
            }

            if (token) {
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
                }
            }
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
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
