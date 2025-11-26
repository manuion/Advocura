import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { firebaseAuth } from '../../services/firebase';

const SignupScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        setLoading(true);
        try {
            await firebaseAuth.createUserWithEmailAndPassword(email, password);
            // Auth state listener in AppNavigator will handle navigation
        } catch (error: any) {
            Alert.alert('Signup Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6 bg-white">
            <Text className="text-3xl font-bold mb-8 text-gray-800">Create Account</Text>

            <TextInput
                className="border border-gray-300 rounded-lg p-4 mb-4 text-gray-800"
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TextInput
                className="border border-gray-300 rounded-lg p-4 mb-6 text-gray-800"
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                className="bg-blue-600 p-4 rounded-lg items-center"
                onPress={handleSignup}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-semibold text-lg">Sign Up</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                className="mt-6 items-center"
                onPress={() => navigation.navigate('Login')}
            >
                <Text className="text-blue-600">Already have an account? Login</Text>
            </TouchableOpacity>
        </View>
    );
};

export default SignupScreen;
