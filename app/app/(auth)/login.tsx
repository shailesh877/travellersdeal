import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { Image, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";
import { registerForPushNotificationsAsync } from '../../utils/pushNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from "../../constants/Config";
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

cssInterop(SafeAreaView, { className: 'style' });

export default function LoginScreen() {
    const [name, setName] = useState("");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [optIn, setOptIn] = useState(true);

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '10387333810-6sqvk5d5j4edjfrgfk9u659f7qcn6k1m.apps.googleusercontent.com',
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleBackendLogin(id_token);
        }
    }, [response]);

    const handleGoogleBackendLogin = async (idToken: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });
            const data = await res.json();
            if (res.ok) {
                await AsyncStorage.setItem('userInfo', JSON.stringify(data));
                registerForPushNotificationsAsync();
                router.replace("/(tabs)");
            } else {
                Alert.alert("Google Login Failed", data.message || "Failed to login with Google");
            }
        } catch (error) {
            Alert.alert("Error", "Network request failed. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };



    const handleForgotPassword = async () => {
        if (!identifier) {
            Alert.alert("Error", "Please enter your email address first to reset password.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/forgotpassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: identifier }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Password reset email sent. Please check your inbox.");
            } else {
                Alert.alert("Error", data.message || "Failed to send reset email.");
            }
        } catch (error) {
            console.error("Forgot Password Error:", error);
            Alert.alert("Error", "Network request failed. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!password) {
            Alert.alert("Error", "Please enter your password");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/continue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: identifier,
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                await AsyncStorage.setItem('userInfo', JSON.stringify(data));
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
        <View className="flex-1 bg-black">
            {/* Background Image - Occupies top half */}
            <View className="absolute top-0 w-full h-[55%]">
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1000' }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
                    className="absolute bottom-0 w-full h-40"
                />
            </View>

            <SafeAreaView className="flex-1 justify-between" edges={['top', 'bottom']}>
                {/* Header: Logo and Close Button */}
                <View className="flex-row justify-between items-start px-2 pt-4">
                    <Image
                        source={require('../../assets/images/android-icon-foreground.png')}
                        className="w-32 h-32"
                        resizeMode="contain"
                    />
                    <TouchableOpacity
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                        className="w-9 h-9 rounded-full border border-white items-center justify-center bg-black/20"
                    >
                        <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Bottom Content Area */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "padding"}
                    className="w-full px-5 pb-4 mt-auto bg-black"
                >
                    <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
                            <View className="w-full">
                                <Text className="text-white text-2xl font-bold mb-6 mt-4">Enter your details</Text>

                                <View className="bg-[#1A1A1A] border border-gray-600 rounded-lg mb-4">
                                    <TextInput
                                        placeholder="Name (optional)"
                                        placeholderTextColor="#888"
                                        value={name}
                                        onChangeText={setName}
                                        className="text-white px-4 py-4 text-base"
                                        autoCapitalize="words"
                                    />
                                </View>

                                <View className="bg-[#1A1A1A] border border-gray-600 rounded-lg mb-4">
                                    <TextInput
                                        placeholder="Email address"
                                        placeholderTextColor="#888"
                                        value={identifier}
                                        onChangeText={setIdentifier}
                                        className="text-white px-4 py-4 text-base"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View className="bg-[#1A1A1A] border border-gray-600 rounded-lg mb-2">
                                    <TextInput
                                        placeholder="Password"
                                        placeholderTextColor="#888"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        className="text-white px-4 py-4 text-base"
                                    />
                                </View>

                                <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading} className="mb-6 items-end">
                                    <Text className="text-white font-medium text-sm">Forgot Password?</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                    className="bg-white rounded-full flex-row items-center justify-center py-4 mb-6"
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="black" />
                                    ) : (
                                        <Text className="text-black font-bold text-base">Sign In / Sign Up</Text>
                                    )}
                                </TouchableOpacity>

                                {/* Legal Text */}
                                <Text className="text-white text-xs leading-5 mb-5 font-medium">
                                    Continue to log in or sign up and accept our <Text onPress={() => WebBrowser.openBrowserAsync('https://travellersdeal.com/term')} className="underline">Terms and Conditions</Text>. See our <Text onPress={() => WebBrowser.openBrowserAsync('https://travellersdeal.com/supplier-privacy-policy')} className="underline">Privacy Policy</Text>.
                                </Text>

                                {/* Opt-in Switch */}
                                <View className="bg-[#EBEBEB] rounded-xl p-4 flex-row justify-between items-center mb-6">
                                    <Text className="text-black text-sm leading-5 flex-1 pr-4 font-medium">
                                        Send me discounts and other offers by email. Opt out any time in your settings
                                    </Text>
                                    <Switch
                                        trackColor={{ false: "#ccc", true: "#0071eb" }}
                                        thumbColor={"#fff"}
                                        value={optIn}
                                        onValueChange={setOptIn}
                                    />
                                </View>
                            </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
