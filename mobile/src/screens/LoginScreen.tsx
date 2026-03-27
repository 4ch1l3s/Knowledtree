import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TextStyle, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
            backgroundColor: '#F7F9F8', // Lighter background if any, mostly white
        },
        container: {
            flexGrow: 1,
            justifyContent: 'center' as const,
            padding: scale.s(24),
        },
        logoContainer: {
            alignItems: 'center' as const,
            marginBottom: scale.vs(40),
            marginTop: scale.vs(20),
        },
        logoImage: {
            width: scale.s(180),
            height: scale.s(180),
            resizeMode: 'contain' as const,
        },
        inputContainer: {
            marginBottom: scale.vs(20),
        },
        label: {
            fontSize: scale.ms(10),
            fontWeight: 'bold' as TextStyle['fontWeight'],
            marginBottom: scale.vs(8),
            marginLeft: scale.s(16),
            color: '#464E47',
            letterSpacing: 0.5,
        },
        inputWrapper: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            borderWidth: 1.5,
            borderColor: '#C4C4C4', // Soft grey border
            borderRadius: scale.s(25), // Pill shape
            paddingHorizontal: scale.s(16),
            height: scale.vs(50),
            backgroundColor: '#FFFFFF',
        },
        inputIcon: {
            marginRight: scale.s(10),
            width: scale.s(20),
            textAlign: 'center' as const,
        },
        inputEyeIcon: {
            padding: scale.s(4),
        },
        input: {
            flex: 1,
            fontSize: scale.ms(14),
            color: '#464E47',
        },
        errorContainer: {
            padding: scale.s(10),
            borderRadius: scale.s(10),
            marginBottom: scale.vs(16),
            backgroundColor: '#FFEBEE',
        },
        errorText: {
            fontSize: scale.ms(12),
            textAlign: 'center' as const,
            fontWeight: '500' as TextStyle['fontWeight'],
            color: '#D32F2F',
        },
        button: {
            height: scale.vs(50),
            borderRadius: scale.s(25), // Pill shape
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            marginTop: scale.vs(10),
            backgroundColor: '#464E47', // Iron Grey
        },
        buttonText: {
            fontSize: scale.ms(16),
            fontWeight: '600' as TextStyle['fontWeight'],
            color: '#FFFFFF',
        },
        registerContainer: {
            marginTop: scale.vs(30),
            flexDirection: 'row' as const,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
        },
        registerText: {
            fontSize: scale.ms(12),
            color: '#757575', // Light grey text
        },
        registerLink: {
            fontSize: scale.ms(12),
            color: '#464E47',
            fontWeight: 'bold' as TextStyle['fontWeight'],
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
                        <Text style={dynamicStyles.label}>USERNAME OR EMAIL ADDRESS</Text>
                        <View style={dynamicStyles.inputWrapper}>
                            <FontAwesome name="user-o" size={scale.ms(16)} color="#8A9A8C" style={dynamicStyles.inputIcon} />
                            <TextInput
                                style={dynamicStyles.input}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                placeholder="Enter your username or email address"
                                placeholderTextColor="#A0A0A0"
                                editable={!isSubmitting}
                            />
                        </View>
                    </View>

                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>PASSWORD</Text>
                        <View style={dynamicStyles.inputWrapper}>
                            <FontAwesome name="lock" size={scale.ms(18)} color="#8A9A8C" style={dynamicStyles.inputIcon} />
                            <TextInput
                                style={dynamicStyles.input}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!isPasswordVisible}
                                placeholder="Enter your password"
                                placeholderTextColor="#A0A0A0"
                                editable={!isSubmitting}
                            />
                            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={dynamicStyles.inputEyeIcon}>
                                <FontAwesome name={isPasswordVisible ? "eye" : "eye-slash"} size={scale.ms(16)} color="#8A9A8C" />
                            </TouchableOpacity>
                        </View>
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
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={dynamicStyles.buttonText}>Login</Text>
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
