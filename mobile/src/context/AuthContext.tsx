import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, LoginResponse } from '../api/auth';
import client from '../api/client';

interface AuthContextType {
    isLoading: boolean;
    userToken: string | null;
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

    const login = async (username: string, password: string) => {
        try {
            const data: LoginResponse = await loginApi(username, password);
            if (data.access_token) {
                setUserToken(data.access_token);
                await AsyncStorage.setItem('userToken', data.access_token);

                // Attach token to default client headers
                client.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
            }
        } catch (e) {
            console.log('Login error', e);
            throw e;
        }
    };

    const logout = async () => {
        setUserToken(null);
        await AsyncStorage.removeItem('userToken');
        delete client.defaults.headers.common['Authorization'];
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let token = await AsyncStorage.getItem('userToken');
            setUserToken(token);

            if (token) {
                client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
        <AuthContext.Provider value={{ login, logout, isLoading, userToken }}>
            {children}
        </AuthContext.Provider>
    );
};
