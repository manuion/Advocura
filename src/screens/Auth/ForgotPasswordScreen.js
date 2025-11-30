import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { resetPassword } from '../../services/authService';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter your email address' });
            return;
        }

        setLoading(true);

        const result = await resetPassword(email);

        setLoading(false);

        if (result.success) {
            Alert.alert(
                'Success',
                'Password reset email sent! Please check your inbox.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } else {
            Toast.show({ type: 'error', text1: 'Error', text2: result.error });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />

            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>A</Text>
                    </View>
                    <Text style={styles.title}>RESET PASSWORD</Text>
                    <Text style={styles.subtitle}>We'll send you a reset link</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>EMAIL ADDRESS</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="counsel@advocura.com"
                            placeholderTextColor="#555"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.resetButton, loading && styles.resetButtonDisabled]}
                        activeOpacity={0.8}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        <Text style={styles.resetButtonText}>
                            {loading ? 'SENDING...' : 'SEND RESET LINK'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.infoText}>
                        You will receive an email with instructions on how to reset your password.
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Remember your password? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoCircle: {
        width: 72,
        height: 72,
        backgroundColor: '#CD7F32',
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#CD7F32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#121212',
        fontFamily: 'serif',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 2.5,
        fontFamily: 'serif',
    },
    subtitle: {
        color: '#999',
        marginTop: 8,
        letterSpacing: 1,
        fontSize: 13,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        color: '#CD7F32',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 16,
    },
    resetButton: {
        backgroundColor: '#CD7F32',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#CD7F32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    resetButtonText: {
        color: '#121212',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 2,
    },
    resetButtonDisabled: {
        opacity: 0.6,
    },
    infoText: {
        color: '#777',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 48,
    },
    footerText: {
        color: '#777',
    },
    footerLink: {
        color: '#CD7F32',
        fontWeight: 'bold',
    },
});

export default ForgotPasswordScreen;
