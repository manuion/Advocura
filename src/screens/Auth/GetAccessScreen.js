import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { signUp } from '../../services/authService';

const GetAccessScreen = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [barCouncilId, setBarCouncilId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        // Validation
        if (!fullName || !email || !password) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in all required fields' });
            return;
        }

        if (password.length < 6) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);

        const result = await signUp(email, password, {
            name: fullName,
            phone,
            barCouncilId,
        });

        setLoading(false);

        if (result.success) {
            Alert.alert(
                'Success',
                'Account created successfully!',
                [{ text: 'OK', onPress: () => console.log('Signup successful') }]
            );
            // Navigation will be handled by auth state listener
        } else {
            Toast.show({ type: 'error', text1: 'Signup Failed', text2: result.error });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>A</Text>
                    </View>
                    <Text style={styles.title}>SIGN UP</Text>
                    <Text style={styles.subtitle}>Create Your Advocura Account</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>FULL NAME *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            placeholderTextColor="#555"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>EMAIL ADDRESS *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="counsel@lawfirm.com"
                            placeholderTextColor="#555"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PASSWORD *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Minimum 6 characters"
                            placeholderTextColor="#555"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PHONE NUMBER</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+1 (555) 123-4567"
                            placeholderTextColor="#555"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>BAR COUNCIL ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., BAR/2024/12345"
                            placeholderTextColor="#555"
                            value={barCouncilId}
                            onChangeText={setBarCouncilId}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        activeOpacity={0.8}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 32,
        paddingVertical: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 64,
        height: 64,
        backgroundColor: '#CD7F32',
        borderRadius: 32,
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#121212',
        fontFamily: 'serif',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 2,
        fontFamily: 'serif',
    },
    subtitle: {
        color: '#999',
        marginTop: 8,
        letterSpacing: 1.5,
        fontSize: 12,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#CD7F32',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 15,
    },
    textArea: {
        height: 100,
        paddingTop: 14,
    },
    submitButton: {
        backgroundColor: '#CD7F32',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#CD7F32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    submitButtonText: {
        color: '#121212',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 2,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
        marginBottom: 16,
    },
    footerText: {
        color: '#777',
    },
    footerLink: {
        color: '#CD7F32',
        fontWeight: 'bold',
    },
});

export default GetAccessScreen;
