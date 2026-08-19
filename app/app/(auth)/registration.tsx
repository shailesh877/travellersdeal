import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../constants/Config";

export default function RegisterScreen() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !mobile || !email || !password || !confirmPassword) {
            Alert.alert("Error", "Please fill all required fields");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert("Invalid Email", "Please enter a valid email address");
            return;
        }

        const cleanedMobile = mobile.trim().replace(/\D/g, '');
        if (cleanedMobile.length !== 10) {
            Alert.alert("Invalid Mobile", "Please enter a valid 10-digit mobile number");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Weak Password", "Password must be at least 6 characters long");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    mobile,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Account created successfully");
                router.replace("/(auth)/login");
            } else {
                Alert.alert("Registration Failed", data.message || "Something went wrong");
            }
        } catch (error) {
            console.error("Registration error:", error);
            Alert.alert("Error", "Network error. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const isPasswordMatch = password === confirmPassword && password.length > 0;
    const passwordStatus = !password || !confirmPassword ? "border-gray-100" : isPasswordMatch ? "border-green-500" : "border-red-500";

    const renderInput = (label: string, value: string, setValue: (t: string) => void, placeholder: string, icon: string, required: boolean = false, keyboardType: any = "default", autoCapitalize: any = "sentences", secureTextEntry: boolean = false, statusColor: string = "border-gray-100", maxLength?: number) => (
        <View className="mb-5">
            <Text className="text-[#002b5c] font-bold text-xs uppercase tracking-widest mb-2 ml-1">
                {label} {required && <Text className="text-red-500">*</Text>}
            </Text>
            <View className={`flex-row items-center bg-gray-50 border ${statusColor} rounded-2xl px-4 py-4`}>
                <Ionicons name={icon as any} size={20} color="#6b7280" />
                <TextInput
                    placeholder={placeholder}
                    value={value}
                    onChangeText={setValue}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    secureTextEntry={secureTextEntry}
                    className="flex-1 ml-3 text-gray-800 text-base"
                    placeholderTextColor="#9ca3af"
                    maxLength={maxLength}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="px-8 pt-10">
                        {/* Header */}
                        <View className="items-center mb-10">
                            <Image
                                source={require("../../assets/images/icon.png")}
                                className="w-32 h-32 rounded-3xl"
                                resizeMode="contain"
                            />
                            <View className="mt-4 items-center">
                                <Text className="text-3xl font-extrabold text-[#002b5c] text-center">
                                    Join Us
                                </Text>
                                <Text className="text-gray-500 text-lg mt-1 text-center">
                                    Create your account to start exploring
                                </Text>
                            </View>
                        </View>

                        {/* Form Section */}
                        <View>
                            {renderInput("Full Name", name, setName, "Enter your full name", "person-outline", true)}
                            {renderInput("Mobile Number", mobile, (t) => setMobile(t.replace(/[^0-9]/g, '')), "Enter 10-digit number", "call-outline", true, "number-pad", "sentences", false, "border-gray-100", 10)}
                            {renderInput("Email Address", email, setEmail, "Enter your email", "mail-outline", true, "email-address", "none")}
                            {renderInput("Create Password", password, setPassword, "Create a strong password", "lock-closed-outline", true, "default", "none", true, passwordStatus)}
                            {renderInput("Confirm Password", confirmPassword, setConfirmPassword, "Re-enter your password", "shield-checkmark-outline", true, "default", "none", true, passwordStatus)}
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.8}
                            className={`bg-[#002b5c] py-5 rounded-2xl shadow-lg mt-8 shadow-[#002b5c]/30 ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-center font-bold text-base uppercase tracking-widest">
                                    Create Account
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Footer */}
                        <View className="mt-10 flex-row justify-center items-center">
                            <Text className="text-gray-500 text-base">Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                                <Text className="text-[#002b5c] font-bold text-base">Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
