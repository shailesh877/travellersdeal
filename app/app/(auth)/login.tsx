import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";
import { registerForPushNotificationsAsync } from '../../utils/pushNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from "../../constants/Config";

cssInterop(SafeAreaView, { className: 'style' });

export default function LoginScreen() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!identifier || !password) {
            Alert.alert("Error", "Please enter email and password");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(identifier.trim())) {
            Alert.alert("Invalid Email", "Please enter a valid email address");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: identifier,
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                await AsyncStorage.setItem('userInfo', JSON.stringify(data));
                // Register push token for this device with the new user session
                registerForPushNotificationsAsync();
                router.replace("/(tabs)");
            } else {
                Alert.alert("Login Failed", data.message || "Invalid credentials");
            }
        } catch (error) {
            console.error("Login Error:", error);
            Alert.alert("Error", "Network request failed. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Stable absolute background that does not shrink when keyboard opens */}
            <View className="bg-[#0071EB] w-full h-80 absolute top-0 rounded-b-[40px]" />
            
            <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
                <KeyboardAvoidingView 
                    className="flex-1" 
                    behavior={Platform.OS === "ios" ? "padding" : "padding"}
                >
                    <ScrollView 
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, justifyContent: 'center' }} 
                        showsVerticalScrollIndicator={false}
                        automaticallyAdjustKeyboardInsets={true}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="w-full max-w-lg self-center px-6 py-6 z-10">
                            {/* Header Section */}
                            <View className="items-center mb-10">
                                <View>
                                    <Text className="text-5xl font-black text-white text-center tracking-tight mb-2">
                                        Travellers Deal
                                    </Text>
                                    <Text className="text-blue-100 text-base font-medium text-center px-4">
                                        Sign in to plan your next adventure
                                    </Text>
                                </View>
                            </View>

                    {/* Form Card Section */}
                    <View className="bg-white rounded-[32px] p-6 shadow-xl shadow-black/10 border border-gray-100 mt-6">
                        <View className="space-y-5">
                            <View>
                                <Text className="text-gray-700 font-bold text-[13px] uppercase tracking-wider mb-2 ml-1">
                                    Email
                                </Text>
                                <View className="flex-row items-center bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:border-[#0071EB]">
                                    <Ionicons name="mail" size={20} color="#9ca3af" />
                                    <TextInput
                                        placeholder="Enter your email"
                                        value={identifier}
                                        onChangeText={setIdentifier}
                                        autoCapitalize="none"
                                        className="flex-1 ml-3 text-gray-800 text-[15px] font-medium"
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>

                            <View className="mt-4">
                                <Text className="text-gray-700 font-bold text-[13px] uppercase tracking-wider mb-2 ml-1">
                                    Password
                                </Text>
                                <View className="flex-row items-center bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:border-[#0071EB]">
                                    <Ionicons name="lock-closed" size={20} color="#9ca3af" />
                                    <TextInput
                                        placeholder="Enter your password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        className="flex-1 ml-3 text-gray-800 text-[15px] font-medium"
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/forgot-password')}
                                className="self-end pt-1"
                            >
                                <Text className="text-[#0071EB] font-bold text-[13px]">Forgot Password?</Text>
                            </TouchableOpacity>

                            {/* Login Button */}
                            <TouchableOpacity
                                onPress={handleLogin}
                                activeOpacity={0.8}
                                className="bg-[#0071EB] py-4 rounded-2xl shadow-lg shadow-[#0071EB]/40 flex-row justify-center items-center mt-6"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white text-center font-bold text-[16px] tracking-wide">
                                        Sign In
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer Section */}
                    <View className="mt-10 flex-row justify-center items-center">
                        <Text className="text-gray-500 font-medium text-[14px]">Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push("/registration")}>
                            <Text className="text-[#0071EB] font-bold text-[14px]">Create one</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
