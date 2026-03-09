import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';

const RegisterScreen = () => {
    const [form, setForm] = useState({
        username: '',
        name: '',
        surname: '',
        email: '',
        phone: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigation = useNavigation();
    const { theme } = useTheme();

    const handleRegister = async () => {
        setIsSubmitting(true);
        // FIXME: Thay thế bằng API đặng ký thực tế
        setTimeout(() => {
            setIsSubmitting(false);
            navigation.goBack();
        }, 1500);
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
        button: {
            paddingVertical: scale.vs(14),
            borderRadius: theme.borderRadius.md,
            alignItems: 'center' as const,
            marginTop: theme.spacing.lg,
            backgroundColor: theme.colors.primary, // Nền xám đen 464E47
        },
        buttonText: {
            fontSize: theme.typography.fontSizeMd,
            fontWeight: 'bold' as TextStyle['fontWeight'],
            color: theme.colors.onPrimary, // Chữ trắng
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
                        <TextInput style={dynamicStyles.input} value={form.username} onChangeText={(v) => setForm({ ...form, username: v })} autoCapitalize="none" />
                    </View>
                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Name</Text>
                        <TextInput style={dynamicStyles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
                    </View>
                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Surname</Text>
                        <TextInput style={dynamicStyles.input} value={form.surname} onChangeText={(v) => setForm({ ...form, surname: v })} />
                    </View>
                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Email Address *</Text>
                        <TextInput style={dynamicStyles.input} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} autoCapitalize="none" keyboardType="email-address" />
                    </View>
                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Phone number</Text>
                        <TextInput style={dynamicStyles.input} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
                    </View>
                    <View style={dynamicStyles.inputContainer}>
                        <Text style={dynamicStyles.label}>Password *</Text>
                        <TextInput style={dynamicStyles.input} value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
                    </View>

                    <TouchableOpacity style={[dynamicStyles.button, isSubmitting && { opacity: 0.6 }]} onPress={handleRegister} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={dynamicStyles.buttonText}>Sign up</Text>}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default RegisterScreen;
