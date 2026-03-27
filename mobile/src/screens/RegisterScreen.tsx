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
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigation = useNavigation<any>();
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
                if (!value) return 'Vui lòng nhập mật khẩu';
                if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
                if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(value)) return 'Mật khẩu cần có ít nhất 1 ký tự đặc biệt';
                if (!/[a-z]/.test(value)) return 'Mật khẩu cần có ít nhất 1 chữ thường';
                if (!/[A-Z]/.test(value)) return 'Mật khẩu cần có ít nhất 1 chữ hoa';
                return '';

            case 'confirmPassword':
                if (!value) return 'Vui lòng nhập lại mật khẩu';
                if (value !== allValues.password) return 'Mật khẩu nhập lại không khớp';
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

        if (!agreeTerms) {
            setServerError("You must agree to the Terms and Conditions.");
            return;
        }

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
        safeArea: { flex: 1, backgroundColor: '#F7F9F8' },
        container: { flexGrow: 1, padding: scale.s(24) },
        headerText: { fontSize: scale.ms(24), fontWeight: 'bold' as TextStyle['fontWeight'], color: '#157A42', marginBottom: scale.vs(24), marginTop: scale.vs(10) },
        inputContainer: { marginBottom: scale.vs(24), position: 'relative' as const },
        label: { fontSize: scale.ms(10), fontWeight: 'bold' as TextStyle['fontWeight'], marginBottom: scale.vs(8), marginLeft: scale.s(16), color: '#464E47', letterSpacing: 0.5 },
        inputWrapper: {
            flexDirection: 'row' as const, alignItems: 'center' as const,
            borderWidth: 1.5, borderColor: '#C4C4C4', borderRadius: scale.s(25),
            paddingHorizontal: scale.s(16), height: scale.vs(50), backgroundColor: '#FFFFFF'
        },
        inputErrorWrapper: { borderColor: theme.colors.error },
        inputIcon: { marginRight: scale.s(10), width: scale.s(20), textAlign: 'center' as const },
        inputEyeIcon: { padding: scale.s(4) },
        input: { flex: 1, fontSize: scale.ms(14), color: '#464E47' },
        errorText: { color: theme.colors.error, fontSize: scale.ms(11), position: 'absolute' as const, bottom: -scale.vs(18), right: scale.s(16), textAlign: 'right' as const },
        checkboxContainer: { flexDirection: 'row' as const, alignItems: 'center' as const, marginVertical: scale.vs(16), paddingRight: scale.s(20) },
        checkboxText: { fontSize: scale.ms(11), color: '#464E47', marginLeft: scale.s(10), flex: 1, lineHeight: scale.vs(16) },
        serverErrorContainer: { padding: scale.s(10), borderRadius: scale.s(10), marginBottom: scale.vs(16), backgroundColor: '#FFEBEE' },
        serverErrorText: { fontSize: scale.ms(12), textAlign: 'center' as const, fontWeight: '500' as TextStyle['fontWeight'], color: '#D32F2F' },
        button: { height: scale.vs(50), borderRadius: scale.s(25), flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: scale.vs(10), backgroundColor: '#464E47' },
        buttonText: { fontSize: scale.ms(16), fontWeight: '600' as TextStyle['fontWeight'], color: '#FFFFFF', marginRight: scale.s(8) },
        loginContainer: { marginTop: scale.vs(30), flexDirection: 'row' as const, justifyContent: 'center' as const, alignItems: 'center' as const },
        loginText: { fontSize: scale.ms(12), color: '#757575' },
        loginLink: { fontSize: scale.ms(12), color: '#464E47', fontWeight: 'bold' as TextStyle['fontWeight'], marginVertical: scale.s(4) }
    };

    return (
        <SafeAreaView style={dynamicStyles.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={dynamicStyles.container} showsVerticalScrollIndicator={false}>

                    <Text style={dynamicStyles.headerText}>Create Account</Text>

                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>USERNAME</Text>
                        <View style={[dynamicStyles.inputWrapper, touched.username && errors.username ? dynamicStyles.inputErrorWrapper : null]}>
                            <FontAwesome name="user-o" size={scale.ms(16)} color="#8A9A8C" style={dynamicStyles.inputIcon} />
                            <TextInput style={dynamicStyles.input} value={form.username} onChangeText={(v) => handleChange('username', v)} onBlur={() => handleBlur('username')} autoCapitalize="none" placeholder="Enter your username" placeholderTextColor="#A0A0A0" />
                        </View>
                        {touched.username && errors.username ? <Text style={dynamicStyles.errorText}>{errors.username}</Text> : null}
                    </View>

                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>FULL NAME</Text>
                        <View style={[dynamicStyles.inputWrapper, touched.name && errors.name ? dynamicStyles.inputErrorWrapper : null]}>
                            <FontAwesome name="user-o" size={scale.ms(16)} color="#8A9A8C" style={dynamicStyles.inputIcon} />
                            <TextInput style={dynamicStyles.input} value={form.name} onChangeText={(v) => handleChange('name', v)} onBlur={() => handleBlur('name')} placeholder="Enter your full name" placeholderTextColor="#A0A0A0" />
                        </View>
                        {touched.name && errors.name ? <Text style={dynamicStyles.errorText}>{errors.name}</Text> : null}
                    </View>

                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>EMAIL ADDRESS</Text>
                        <View style={[dynamicStyles.inputWrapper, touched.email && errors.email ? dynamicStyles.inputErrorWrapper : null]}>
                            <FontAwesome name="envelope-o" size={scale.ms(16)} color="#8A9A8C" style={dynamicStyles.inputIcon} />
                            <TextInput style={dynamicStyles.input} value={form.email} onChangeText={(v) => handleChange('email', v)} onBlur={() => handleBlur('email')} autoCapitalize="none" keyboardType="email-address" placeholder="email@example.com" placeholderTextColor="#A0A0A0" />
                        </View>
                        {touched.email && errors.email ? <Text style={dynamicStyles.errorText}>{errors.email}</Text> : null}
                    </View>

                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>PASSWORD</Text>
                        <View style={[dynamicStyles.inputWrapper, touched.password && errors.password ? dynamicStyles.inputErrorWrapper : null]}>
                            <FontAwesome name="lock" size={scale.ms(18)} color="#8A9A8C" style={dynamicStyles.inputIcon} />
                            <TextInput style={dynamicStyles.input} value={form.password} onChangeText={(v) => handleChange('password', v)} onBlur={() => handleBlur('password')} secureTextEntry={!isPasswordVisible} placeholder="Create a password" placeholderTextColor="#A0A0A0" />
                            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={dynamicStyles.inputEyeIcon}>
                                <FontAwesome name={isPasswordVisible ? "eye" : "eye-slash"} size={scale.ms(16)} color="#8A9A8C" />
                            </TouchableOpacity>
                        </View>
                        {touched.password && errors.password ? <Text style={dynamicStyles.errorText}>{errors.password}</Text> : null}
                    </View>

                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>CONFIRM PASSWORD</Text>
                        <View style={[dynamicStyles.inputWrapper, touched.confirmPassword && errors.confirmPassword ? dynamicStyles.inputErrorWrapper : null]}>
                            <FontAwesome name="refresh" size={scale.ms(16)} color="#8A9A8C" style={dynamicStyles.inputIcon} />
                            <TextInput style={dynamicStyles.input} value={form.confirmPassword} onChangeText={(v) => handleChange('confirmPassword', v)} onBlur={() => handleBlur('confirmPassword')} secureTextEntry={!isPasswordVisible} placeholder="Repeat password" placeholderTextColor="#A0A0A0" />
                            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={dynamicStyles.inputEyeIcon}>
                                <FontAwesome name={isPasswordVisible ? "eye" : "eye-slash"} size={scale.ms(16)} color="#8A9A8C" />
                            </TouchableOpacity>
                        </View>
                        {touched.confirmPassword && errors.confirmPassword ? <Text style={dynamicStyles.errorText}>{errors.confirmPassword}</Text> : null}
                    </View>

                    <TouchableOpacity style={dynamicStyles.checkboxContainer} onPress={() => setAgreeTerms(!agreeTerms)} activeOpacity={0.8}>
                        <FontAwesome name={agreeTerms ? "check-square" : "square-o"} size={scale.ms(20)} color={agreeTerms ? "#464E47" : "#A0A0A0"} />
                        <Text style={dynamicStyles.checkboxText}>I agree to the Terms and Conditions and the Privacy Policy of Kairos Garden.</Text>
                    </TouchableOpacity>

                    {serverError && (
                        <View style={dynamicStyles.serverErrorContainer}>
                            <Text style={dynamicStyles.serverErrorText}>{serverError}</Text>
                        </View>
                    )}

                    <TouchableOpacity style={[dynamicStyles.button, isSubmitting && { opacity: 0.6 }]} onPress={handleRegister} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={dynamicStyles.buttonText}>Sign Up</Text>
                                <FontAwesome name="arrow-right" size={scale.ms(14)} color="#FFFFFF" />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={dynamicStyles.loginContainer}>
                        <Text style={dynamicStyles.loginText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={dynamicStyles.loginLink}> Log in</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default RegisterScreen;
