import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { sendPasswordResetCode } from '../api/auth';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';
import { useLocalization } from '../localization';

const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || fallback;

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sentEmail, setSentEmail] = useState<string | null>(null);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { theme } = useTheme();
    const { t } = useLocalization();

    const trimmedEmail = email.trim();
    const canSubmit = trimmedEmail.length > 0 && !isSubmitting;

    const handleSubmit = async () => {
        if (!trimmedEmail) {
            setError(t('auth.validation.emailRequired'));
            return;
        }

        if (!trimmedEmail.includes('@')) {
            setError(t('auth.validation.emailInvalid'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await sendPasswordResetCode({ email: trimmedEmail });
            setSentEmail(trimmedEmail);
        } catch (submitError: any) {
            setError(getErrorMessage(submitError, t('auth.resetSendError')));
        } finally {
            setIsSubmitting(false);
        }
    };

    const dynamicStyles = {
        safeArea: {
            flex: 1,
            backgroundColor: '#F7F9F8',
        },
        container: {
            flexGrow: 1,
            justifyContent: 'center' as const,
            padding: scale.s(24),
        },
        backButton: {
            width: scale.s(42),
            height: scale.s(42),
            borderRadius: scale.s(21),
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#DCE5DB',
            marginBottom: scale.vs(34),
        },
        iconWrap: {
            width: scale.s(76),
            height: scale.s(76),
            borderRadius: scale.s(38),
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            alignSelf: 'center' as const,
            backgroundColor: '#E8F6E8',
            borderWidth: 1,
            borderColor: '#D4E2D2',
            marginBottom: scale.vs(22),
        },
        title: {
            color: '#157A42',
            fontSize: scale.ms(26),
            fontWeight: '800' as TextStyle['fontWeight'],
            lineHeight: scale.ms(34),
            textAlign: 'center' as const,
        },
        subtitle: {
            width: '100%' as const,
            marginTop: scale.vs(10),
            marginBottom: scale.vs(30),
            color: '#59625A',
            fontSize: scale.ms(13),
            fontWeight: '600' as TextStyle['fontWeight'],
            lineHeight: scale.ms(20),
            textAlign: 'center' as const,
        },
        inputContainer: {
            marginBottom: scale.vs(18),
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
            borderColor: error ? theme.colors.error : '#C4C4C4',
            borderRadius: scale.s(25),
            paddingHorizontal: scale.s(16),
            height: scale.vs(50),
            backgroundColor: '#FFFFFF',
        },
        inputIcon: {
            marginRight: scale.s(10),
            width: scale.s(20),
            textAlign: 'center' as const,
        },
        input: {
            flex: 1,
            fontSize: scale.ms(14),
            color: '#464E47',
        },
        feedbackContainer: {
            padding: scale.s(12),
            borderRadius: scale.s(12),
            marginBottom: scale.vs(16),
        },
        errorContainer: {
            backgroundColor: '#FFEBEE',
        },
        successContainer: {
            backgroundColor: '#E8F6E8',
            borderWidth: 1,
            borderColor: '#CFE2CC',
        },
        feedbackText: {
            fontSize: scale.ms(12),
            textAlign: 'center' as const,
            fontWeight: '600' as TextStyle['fontWeight'],
            lineHeight: scale.ms(18),
        },
        errorText: {
            color: '#D32F2F',
        },
        successText: {
            color: '#3B653F',
        },
        button: {
            height: scale.vs(50),
            borderRadius: scale.s(25),
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            marginTop: scale.vs(8),
            backgroundColor: '#464E47',
        },
        buttonDisabled: {
            opacity: 0.6,
        },
        buttonText: {
            fontSize: scale.ms(16),
            fontWeight: '700' as TextStyle['fontWeight'],
            color: '#FFFFFF',
        },
        loginContainer: {
            marginTop: scale.vs(28),
            flexDirection: 'row' as const,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
        },
        loginText: {
            fontSize: scale.ms(12),
            color: '#757575',
        },
        loginLink: {
            fontSize: scale.ms(12),
            color: '#464E47',
            fontWeight: 'bold' as TextStyle['fontWeight'],
            marginLeft: scale.s(4),
        },
    };

    return (
        <SafeAreaView style={dynamicStyles.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={dynamicStyles.container} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                        style={dynamicStyles.backButton}
                        activeOpacity={0.78}
                        onPress={() => navigation.goBack()}
                    >
                        <FontAwesome name="angle-left" size={scale.ms(22)} color="#464E47" />
                    </TouchableOpacity>

                    <View style={dynamicStyles.iconWrap}>
                        <FontAwesome name="envelope-o" size={scale.ms(30)} color="#3B653F" />
                    </View>

                    <Text style={dynamicStyles.title}>{t('auth.forgotTitle')}</Text>
                    <Text style={dynamicStyles.subtitle}>
                        {t('auth.forgotSubtitle')}
                    </Text>

                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>{t('auth.emailAddress')}</Text>
                        <View style={dynamicStyles.inputWrapper}>
                            <FontAwesome name="envelope-o" size={scale.ms(16)} color="#8A9A8C" style={dynamicStyles.inputIcon} />
                            <TextInput
                                style={dynamicStyles.input}
                                value={email}
                                onChangeText={(value) => {
                                    setEmail(value);
                                    setError(null);
                                    setSentEmail(null);
                                }}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                                placeholder={t('auth.emailPlaceholder')}
                                placeholderTextColor="#A0A0A0"
                                editable={!isSubmitting}
                            />
                        </View>
                    </View>

                    {error && (
                        <View style={[dynamicStyles.feedbackContainer, dynamicStyles.errorContainer]}>
                            <Text style={[dynamicStyles.feedbackText, dynamicStyles.errorText]}>{error}</Text>
                        </View>
                    )}

                    {sentEmail && (
                        <View style={[dynamicStyles.feedbackContainer, dynamicStyles.successContainer]}>
                            <Text style={[dynamicStyles.feedbackText, dynamicStyles.successText]}>
                                {t('auth.resetSentTo', { email: sentEmail })}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[dynamicStyles.button, !canSubmit && dynamicStyles.buttonDisabled]}
                        activeOpacity={0.82}
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={dynamicStyles.buttonText}>{t('auth.sendResetLink')}</Text>
                        )}
                    </TouchableOpacity>

                    <View style={dynamicStyles.loginContainer}>
                        <Text style={dynamicStyles.loginText}>{t('auth.rememberPassword')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={dynamicStyles.loginLink}>{t('auth.login')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ForgotPasswordScreen;
