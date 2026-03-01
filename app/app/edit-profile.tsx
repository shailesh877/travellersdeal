import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "../constants/Config";

export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";

    // Profile fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Password fields
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const userInfo = await AsyncStorage.getItem("userInfo");
            if (!userInfo) { router.replace("/(auth)/login"); return; }
            const parsed = JSON.parse(userInfo);

            // ✅ Immediately show data from local storage (no delay)
            setName(parsed.name || "");
            setEmail(parsed.email || "");
            setPhone(parsed.phone || "");

            // Then try to refresh from API
            const { token } = parsed;
            const res = await fetch(`${API_URL}/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setName(data.name || "");
                setEmail(data.email || "");
                setPhone(data.phone || "");
            }
        } catch (e) {
            console.error("Error loading profile", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) { Alert.alert("Error", "Name cannot be empty."); return; }
        if (!email.trim()) { Alert.alert("Error", "Email cannot be empty."); return; }

        setSaving(true);
        try {
            const userInfo = await AsyncStorage.getItem("userInfo");
            if (!userInfo) return;
            const parsed = JSON.parse(userInfo);
            const { token } = parsed;

            const res = await fetch(`${API_URL}/users/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                // Update stored userInfo
                await AsyncStorage.setItem("userInfo", JSON.stringify({
                    ...parsed,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                }));
                Alert.alert("✅ Saved", "Your profile has been updated.");
            } else {
                Alert.alert("Error", data.message || `Server error (${res.status})`);
            }
        } catch (e: any) {
            console.error("Save profile error:", e);
            Alert.alert("Error", `Network error: ${e?.message || 'Please restart the backend server and try again.'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword) { Alert.alert("Error", "Enter your current password."); return; }
        if (!newPassword || newPassword.length < 6) { Alert.alert("Error", "New password must be at least 6 characters."); return; }
        if (newPassword !== confirmPassword) { Alert.alert("Error", "Passwords do not match."); return; }

        setChangingPassword(true);
        try {
            const userInfo = await AsyncStorage.getItem("userInfo");
            if (!userInfo) return;
            const { token } = JSON.parse(userInfo);

            const res = await fetch(`${API_URL}/users/change-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                Alert.alert("✅ Done", "Password changed successfully.");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                Alert.alert("Error", data.message || "Failed to change password.");
            }
        } catch (e) {
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setChangingPassword(false);
        }
    };

    const inputClass = "bg-gray-50 dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white text-base";
    const labelClass = "text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5";

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white dark:bg-black">
                <ActivityIndicator size="large" color="#002b5c" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-white dark:bg-black"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ paddingTop: insets.top }}
        >
            {/* Header */}
            <View className="flex-row items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#111"} />
                </TouchableOpacity>
                <Text className="text-gray-900 dark:text-white text-xl font-black flex-1">Edit Profile</Text>
                <TouchableOpacity
                    onPress={handleSaveProfile}
                    disabled={saving}
                    className="bg-[#002b5c] px-5 py-2 rounded-full"
                >
                    {saving
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text className="text-white font-bold text-sm">Save</Text>
                    }
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
            >
                {/* Avatar Placeholder */}
                <View className="items-center mb-8">
                    <View className="w-20 h-20 rounded-full bg-[#002b5c] items-center justify-center mb-2">
                        <Text className="text-white text-3xl font-black">{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text className="text-gray-400 text-sm">Traveller Account</Text>
                </View>

                {/* Personal Info Section */}
                <Text className="text-gray-900 dark:text-white font-black text-base mb-4">Personal Information</Text>

                <View className="mb-4">
                    <Text className={labelClass}>Full Name</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Your full name"
                        placeholderTextColor="#9ca3af"
                        className={inputClass}
                        autoCapitalize="words"
                    />
                </View>

                <View className="mb-4">
                    <Text className={labelClass}>Email Address</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your@email.com"
                        placeholderTextColor="#9ca3af"
                        className={inputClass}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View className="mb-8">
                    <Text className={labelClass}>Phone Number</Text>
                    <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+91 00000 00000"
                        placeholderTextColor="#9ca3af"
                        className={inputClass}
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Divider */}
                <View className="border-t border-gray-100 dark:border-gray-800 mb-8" />

                {/* Change Password Section */}
                <Text className="text-gray-900 dark:text-white font-black text-base mb-4">Change Password</Text>

                <View className="mb-4">
                    <Text className={labelClass}>Current Password</Text>
                    <View className="relative">
                        <TextInput
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Enter current password"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry={!showCurrent}
                            className={inputClass}
                            style={{ paddingRight: 44 }}
                        />
                        <TouchableOpacity
                            onPress={() => setShowCurrent(!showCurrent)}
                            className="absolute right-4 top-3.5"
                        >
                            <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="mb-4">
                    <Text className={labelClass}>New Password</Text>
                    <View className="relative">
                        <TextInput
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="At least 6 characters"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry={!showNew}
                            className={inputClass}
                            style={{ paddingRight: 44 }}
                        />
                        <TouchableOpacity
                            onPress={() => setShowNew(!showNew)}
                            className="absolute right-4 top-3.5"
                        >
                            <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="mb-6">
                    <Text className={labelClass}>Confirm New Password</Text>
                    <View className="relative">
                        <TextInput
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Repeat new password"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry={!showConfirm}
                            className={`${inputClass} ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400' : ''}`}
                            style={{ paddingRight: 44 }}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirm(!showConfirm)}
                            className="absolute right-4 top-3.5"
                        >
                            <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                    {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                        <Text className="text-red-500 text-xs mt-1">Passwords do not match</Text>
                    )}
                </View>

                <TouchableOpacity
                    onPress={handleChangePassword}
                    disabled={changingPassword}
                    className="bg-[#002b5c] dark:bg-[#58a6ff] w-full py-4 rounded-2xl items-center flex-row justify-center"
                >
                    {changingPassword
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <>
                            <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                            <Text className="text-white font-black text-base ml-2">Change Password</Text>
                        </>
                    }
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
