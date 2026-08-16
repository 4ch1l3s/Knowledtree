import React, { useContext, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GrowTreeScreen from '../screens/GrowTreeScreen';
import TagsScreen from '../screens/TagsScreen';
import FriendScreen from '../screens/FriendScreen';
import ShopScreen from '../screens/ShopScreen';
import TreepediaScreen from '../screens/TreepediaScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DailyMissionsScreen from '../screens/DailyMissionsScreen';
import { getTodayDailyMissions } from '../api/dailyMissions';

// Define the parameter list for the stack navigator
export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    Profile: undefined;
    GrowTree: undefined;
    Treepedia: undefined;
    Shop: undefined;
    Tags: undefined;
    Friend: undefined;
    History: undefined;
    Settings: undefined;
    DailyMissions: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    const { isLoading, userToken } = useContext(AuthContext);

    useEffect(() => {
        if (userToken) {
            // Assignment is lazy and idempotent: opening the authenticated app creates today's three missions.
            getTodayDailyMissions().catch(() => undefined);
        }
    }, [userToken]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {userToken == null ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="GrowTree" component={GrowTreeScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Treepedia" component={TreepediaScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Shop" component={ShopScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Tags" component={TagsScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Friend" component={FriendScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="DailyMissions" component={DailyMissionsScreen} options={{ headerShown: false }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;

