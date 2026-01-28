import React, { useContext, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = () => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('123qwe');
    const { login } = useContext(AuthContext);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await login(username, password);
        } catch (e: any) {
            const errorMessage = e.response?.data?.error_description || e.message || 'Unknown error';
            setError(`Error: ${errorMessage}`);
            console.error('Login Error Details:', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Knowledtree Login</Text>
            <TextInput
                style={styles.input}
                value={username}
                placeholder="Username"
                onChangeText={setUsername}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                value={password}
                placeholder="Password"
                onChangeText={setPassword}
                secureTextEntry
            />
            {error && <Text style={styles.error}>{error}</Text>}
            {isSubmitting ? (
                <ActivityIndicator size="large" />
            ) : (
                <Button title="Login" onPress={handleLogin} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
    },
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
});

export default LoginScreen;
