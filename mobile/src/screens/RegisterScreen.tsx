import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';

const RegisterScreen = () => {
    const [form, setForm] = useState({
        username: '',
        name: '',
        surname: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [touched, setTouched] = useState<Partial<Record<keyof typeof form, boolean>>>({});
    const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const navigation = useNavigation();
    const { register } = useContext(AuthContext);
    const { theme } = useTheme();

    const getFieldError = (field: keyof typeof form, value: string, allValues: typeof form) => {
        const trimmed = value.trim();
        switch (field) {
            case 'username':
                if (!trimmed) return 'Vui lòng nhập tên đăng nhập';
                if (trimmed.length < 3) return 'Tên đăng nhập phải có ít nhất 3 ký tự';
                return '';

            case 'name':
                if (!trimmed) return 'Vui lòng nhập tên của bạn';
                if (trimmed.length < 3) return 'Tên phải có ít nhất 3 ký tự';
                return '';

            case 'email':
                if (!trimmed) return 'Vui lòng nhập email';
                if (!trimmed.includes('@')) return 'Email không đúng định dạng';
                return '';

            case 'password':
                if (!trimmed) return 'Vui lòng nhập mật khẩu';
                if (trimmed.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
                if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(trimmed)) return 'Mật khẩu cần có ít nhất 1 ký tự đặc biệt';
                if (!/[a-z]/.test(trimmed)) return 'Mật khẩu cần có ít nhất 1 chữ thường';
                if (!/[A-Z]/.test(trimmed)) return 'Mật khẩu cần có ít nhất 1 chữ hoa';
                return '';

            case 'confirmPassword':
                if (!trimmed) return 'Vui lòng nhập lại mật khẩu';
                if (trimmed !== allValues.password.trim()) return 'Mật khẩu nhập lại không khớp';
                return '';

            default:
                return '';
        }
    };
    const handleBlur = (field: keyof typeof form) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({ ...prev, [field]: getFieldError(field, form[field], form) }));
    };

    const handleChange = (field: keyof typeof form, value: string) => {
        const newForm = { ...form, [field]: value };
        setForm(newForm);
        if (touched[field]) {
            setErrors(prev => ({ ...prev, [field]: getFieldError(field, value, newForm) }));
            if (field === 'password' && touched.confirmPassword) {
                setErrors(prev => ({ ...prev, confirmPassword: getFieldError('confirmPassword', newForm.confirmPassword, newForm) }));
            }
        }
    };

    const handleRegister = async () => {
        const fieldsToValidate: (keyof typeof form)[] = ['username', 'name', 'email', 'password', 'confirmPassword'];
        const newTouched: any = { ...touched };
        const newErrors: any = { ...errors };
        let hasError = false;

        fieldsToValidate.forEach(field => {
            newTouched[field] = true;
            const err = getFieldError(field, form[field], form);
            newErrors[field] = err;
            if (err) hasError = true;
        });

        setTouched(newTouched);
        setErrors(newErrors);

        if (hasError) return;

        setIsSubmitting(true);
        setServerError(null);
        try {
            await register({
                userName: form.username.trim(),
                emailAddress: form.email.trim(),
                password: form.password,
                appName: 'Knowledtree',
                name: form.name.trim() || undefined,
                surname: form.surname.trim() || undefined,
                phoneNumber: form.phone.trim() || undefined,
            });
            // register() in AuthContext auto-logs in, so navigation to Home happens automatically
        } catch (e: any) {
            const responseData = e.response?.data;
            // ABP returns validation errors in error.message or error.validationErrors
            const abpError = responseData?.error;
            if (abpError?.validationErrors?.length) {
                setServerError(abpError.validationErrors.map((ve: any) => ve.message).join('\n'));
            } else if (abpError?.message) {
                setServerError(abpError.message);
            } else {
                setServerError(e.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
            }
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
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            marginBottom: theme.spacing.lg,
        },
        backButton: {
            padding: theme.spacing.xs,
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
            backgroundColor: theme.colors.backgroundSecondary, // Màu xanh nhạt F1FFFA
            borderColor: '#464E47', // 464E47
            color: theme.colors.text,
        },
        inputError: {
            borderColor: theme.colors.error,
        },
        errorText: {
            color: theme.colors.error,
            fontSize: theme.typography.fontSizeSm,
            marginTop: scale.vs(4),
        },
        serverErrorContainer: {
            padding: scale.s(8),
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.md,
            backgroundColor: theme.colors.errorLight,
        },
        serverErrorText: {
            fontSize: theme.typography.fontSizeSm,
            textAlign: 'center' as const,
            fontWeight: '500' as TextStyle['fontWeight'],
            color: theme.colors.error,
        },
        button: {
            paddingVertical: scale.vs(14),
            borderRadius: theme.borderRadius.md,
            alignItems: 'center' as const,
            marginTop: theme.spacing.lg,
            backgroundColor: theme.colors.primary,
        },
        buttonText: {
            fontSize: theme.typography.fontSizeMd,
            fontWeight: 'bold' as TextStyle['fontWeight'],
            color: theme.colors.onPrimary,
        },
    };

    return (
        <SafeAreaView style={dynamicStyles.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={dynamicStyles.container} showsVerticalScrollIndicator={false}>

                    <View style={dynamicStyles.header}>
                        <TouchableOpacity style={dynamicStyles.backButton} onPress={() => navigation.goBack()}>
                            <FontAwesome name="chevron-left" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Username *</Text>
                        <TextInput style={[dynamicStyles.input, touched.username && errors.username ? dynamicStyles.inputError : null]} value={form.username} onChangeText={(v) => handleChange('username', v)} onBlur={() => handleBlur('username')} autoCapitalize="none" />
                        {touched.username && errors.username ? <Text style={dynamicStyles.errorText}>{errors.username}</Text> : null}
                    </View>
                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Name *</Text>
                        <TextInput style={[dynamicStyles.input, touched.name && errors.name ? dynamicStyles.inputError : null]} value={form.name} onChangeText={(v) => handleChange('name', v)} onBlur={() => handleBlur('name')} />
                        {touched.name && errors.name ? <Text style={dynamicStyles.errorText}>{errors.name}</Text> : null}
                    </View>
                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Surname</Text>
                        <TextInput style={dynamicStyles.input} value={form.surname} onChangeText={(v) => handleChange('surname', v)} />
                    </View>
                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Email Address *</Text>
                        <TextInput style={[dynamicStyles.input, touched.email && errors.email ? dynamicStyles.inputError : null]} value={form.email} onChangeText={(v) => handleChange('email', v)} onBlur={() => handleBlur('email')} autoCapitalize="none" keyboardType="email-address" />
                        {touched.email && errors.email ? <Text style={dynamicStyles.errorText}>{errors.email}</Text> : null}
                    </View>
                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Phone number</Text>
                        <TextInput style={dynamicStyles.input} value={form.phone} onChangeText={(v) => handleChange('phone', v)} keyboardType="phone-pad" />
                    </View>
                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Password *</Text>
                        <TextInput style={[dynamicStyles.input, touched.password && errors.password ? dynamicStyles.inputError : null]} value={form.password} onChangeText={(v) => handleChange('password', v)} onBlur={() => handleBlur('password')} secureTextEntry />
                        {touched.password && errors.password ? <Text style={dynamicStyles.errorText}>{errors.password}</Text> : null}
                    </View>
                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Confirm Password *</Text>
                        <TextInput style={[dynamicStyles.input, touched.confirmPassword && errors.confirmPassword ? dynamicStyles.inputError : null]} value={form.confirmPassword} onChangeText={(v) => handleChange('confirmPassword', v)} onBlur={() => handleBlur('confirmPassword')} secureTextEntry />
                        {touched.confirmPassword && errors.confirmPassword ? <Text style={dynamicStyles.errorText}>{errors.confirmPassword}</Text> : null}
                    </View>

                    {serverError && (
                        <View style={dynamicStyles.serverErrorContainer}>
                            <Text style={dynamicStyles.serverErrorText}>{serverError}</Text>
                        </View>
                    )}

                    <TouchableOpacity style={[dynamicStyles.button, isSubmitting && { opacity: 0.6 }]} onPress={handleRegister} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={dynamicStyles.buttonText}>Sign up</Text>}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default RegisterScreen;
