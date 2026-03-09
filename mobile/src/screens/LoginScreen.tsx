import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TextStyle, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { login } = useContext(AuthContext);
    const { theme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handleLogin = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await login(username, password);
        } catch (e: any) {
            const errorMessage = e.response?.data?.error_description || e.message || 'Lỗi không xác định';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const dynamicStyles = {
        safeArea: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        container: {
            flexGrow: 1,
            justifyContent: 'center' as const,
            padding: theme.spacing.lg,
        },
        logoContainer: {
            alignItems: 'center' as const,
            marginBottom: scale.vs(40),
            marginTop: scale.vs(20),
        },
        logoImage: {
            width: scale.s(220),
            height: scale.s(220),
            resizeMode: 'contain' as const,
        },
        inputContainer: {
            marginBottom: scale.vs(16),
        },
        label: {
            fontSize: theme.typography.fontSizeSm,
            fontWeight: '600' as TextStyle['fontWeight'],
            marginBottom: scale.vs(6),
            color: theme.colors.text,
        },
        input: {
            borderWidth: 1,
            paddingVertical: scale.vs(10),
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSizeMd,
            backgroundColor: theme.colors.backgroundSecondary, // F1FFFA xanh lá rất nhẹ
            borderColor: '#464E47', // 464E47
            color: theme.colors.text, // 464E47
        },
        errorContainer: {
            padding: scale.s(8),
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.md,
            backgroundColor: theme.colors.errorLight,
        },
        errorText: {
            fontSize: theme.typography.fontSizeSm,
            textAlign: 'center' as const,
            fontWeight: '500' as TextStyle['fontWeight'],
            color: theme.colors.error,
        },
        button: {
            paddingVertical: scale.vs(14),
            borderRadius: theme.borderRadius.md,
            alignItems: 'center' as const,
            marginTop: theme.spacing.sm,
            backgroundColor: theme.colors.primary, // 464E47
        },
        buttonText: {
            fontSize: theme.typography.fontSizeMd,
            fontWeight: 'bold' as TextStyle['fontWeight'],
            color: theme.colors.onPrimary, // FFFFFF
        },
        registerContainer: {
            marginTop: theme.spacing.lg,
            flexDirection: 'row' as const,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
        },
        registerText: {
            fontSize: theme.typography.fontSizeSm,
            color: theme.colors.textSecondary,
        },
        registerLink: {
            fontSize: theme.typography.fontSizeSm,
            color: theme.colors.primary, // 464E47
            fontWeight: '600' as TextStyle['fontWeight'],
            textDecorationLine: 'underline' as const,
            marginLeft: scale.s(4),
        }
    };

    return (
        <SafeAreaView style={dynamicStyles.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={dynamicStyles.container} showsVerticalScrollIndicator={false}>

                    {/* Logo (KAIROS GARDEN) */}
                    <View style={dynamicStyles.logoContainer}>
                        <Image source={require('../../res/logo/LOGOOOOO.png')} style={dynamicStyles.logoImage} />
                    </View>

                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Username or Email Address</Text>
                        <TextInput
                            style={dynamicStyles.input}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            editable={!isSubmitting}
                        />
                    </View>

                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Password</Text>
                        <TextInput
                            style={dynamicStyles.input}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!isSubmitting}
                        />
                    </View>

                    {error && (
                        <View style={dynamicStyles.errorContainer}>
                            <Text style={dynamicStyles.errorText}>{error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[dynamicStyles.button, isSubmitting && { opacity: 0.6 }]}
                        onPress={handleLogin}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={theme.colors.onPrimary} />
                        ) : (
                            <Text style={dynamicStyles.buttonText}>Log in</Text>
                        )}
                    </TouchableOpacity>

                    <View style={dynamicStyles.registerContainer}>
                        <Text style={dynamicStyles.registerText}>Don't have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={dynamicStyles.registerLink}>Register</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;
