import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "../../constants/Config";

export default function ForgotPasswordScreen() {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim()) {
            Alert.alert("Error", "Please enter your email address.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgotpassword`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const data = await res.json();
            if (res.ok) {
                setSent(true);
            } else {
                Alert.alert("Error", data.message || "Something went wrong. Please try again.");
            }
        } catch {
            Alert.alert("Error", "Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-white"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ paddingTop: insets.top }}
        >
            {/* Header */}
            <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
                    <Ionicons name="arrow-back" size={24} color="#002b5c" />
                </TouchableOpacity>
                <Text className="text-[#002b5c] text-xl font-black">Forgot Password</Text>
            </View>

            <View className="flex-1 px-8 pt-10">
                {!sent ? (
                    <>
                        {/* Icon */}
                        <View className="items-center mb-8">
                            <View className="w-20 h-20 rounded-full bg-[#e8eef7] items-center justify-center mb-4">
                                <Ionicons name="lock-open-outline" size={40} color="#002b5c" />
                            </View>
                            <Text className="text-2xl font-black text-[#002b5c] text-center">Reset your password</Text>
                            <Text className="text-gray-500 text-center mt-2 leading-relaxed">
                                Enter your registered email address and we'll send you a link to reset your password.
                            </Text>
                        </View>

                        {/* Email Input */}
                        <Text className="text-[#002b5c] font-bold text-sm uppercase tracking-wider mb-2 ml-1">
                            Email Address
                        </Text>
                        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 mb-6">
                            <Ionicons name="mail-outline" size={20} color="#6b7280" />
                            <TextInput
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                className="flex-1 ml-3 text-gray-800 text-base"
                                placeholderTextColor="#9ca3af"
                                onSubmitEditing={handleSubmit}
                                returnKeyType="send"
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.85}
                            className="bg-[#002b5c] py-5 rounded-2xl shadow-lg flex-row justify-center items-center"
                        >
                            {loading
                                ? <ActivityIndicator color="white" />
                                : <Text className="text-white font-bold text-lg">Send Reset Link</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.back()} className="mt-6 items-center">
                            <Text className="text-gray-500 font-medium">Back to Login</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    /* Success State */
                    <View className="flex-1 items-center justify-center">
                        <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-6">
                            <Ionicons name="checkmark-circle" size={56} color="#22c55e" />
                        </View>
                        <Text className="text-2xl font-black text-[#002b5c] text-center mb-3">Check your inbox!</Text>
                        <Text className="text-gray-500 text-center leading-relaxed px-4">
                            We've sent a password reset link to{"\n"}
                            <Text className="font-bold text-[#002b5c]">{email}</Text>
                        </Text>
                        <Text className="text-gray-400 text-sm text-center mt-4 px-4">
                            Didn't receive it? Check your spam folder.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.replace("/(auth)/login")}
                            className="mt-8 bg-[#002b5c] px-10 py-4 rounded-2xl"
                        >
                            <Text className="text-white font-bold text-base">Back to Login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setSent(false); setEmail(""); }} className="mt-4">
                            <Text className="text-[#002b5c] font-semibold">Try a different email</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}
