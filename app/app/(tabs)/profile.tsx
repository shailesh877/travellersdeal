import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Linking, Modal, Platform, ScrollView, Text, TouchableOpacity, View, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { API_URL } from "../../constants/Config";

const THEME_KEY = 'user-theme';

export default function ProfileScreen() {
    const { colorScheme, setColorScheme } = useColorScheme();
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
    const [isAppearanceModalVisible, setAppearanceModalVisible] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [userInfo, setUserInfo] = useState<any>(null);
    const [appSettings, setAppSettings] = useState<{ playStoreUrl: string; appStoreUrl: string; feedbackUrl: string } | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_KEY);
                if (savedTheme) setCurrentTheme(savedTheme as any);

                const userStr = await AsyncStorage.getItem('userInfo');
                if (userStr) {
                    setUserInfo(JSON.parse(userStr));
                }
            } catch (e) {
                console.log('Error loading settings', e);
            }
        };
        loadSettings();

        // Fetch app store links from backend
        fetch(`${API_URL}/admin/settings`)
            .then(r => r.json())
            .then(data => setAppSettings(data))
            .catch(() => { }); // silently ignore if backend not updated yet
    }, []);

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem('userInfo');
                        router.replace("/(auth)/login");
                    }
                }
            ]
        );
    };

    // ... existing modal logic

    const languages = [
        { label: "English", code: "en" },
        { label: "हिंदी (Hindi)", code: "hi" },
        { label: "Español (Spanish)", code: "es" },
    ];

    const appearanceOptions = [
        { label: t('light'), code: "light" },
        { label: t('dark'), code: "dark" },
        { label: t('system_default'), code: "system" },
    ];

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        setLanguageModalVisible(false);
    };

    const changeAppearance = async (code: 'light' | 'dark' | 'system') => {
        try {
            setCurrentTheme(code);
            setColorScheme(code);
            await AsyncStorage.setItem(THEME_KEY, code);
            setAppearanceModalVisible(false);
        } catch (e) {
            console.log('Error saving theme preference', e);
        }
    };

    const renderRow = (label: string, value?: string, isDestructive: boolean = false, hasArrow: boolean = true, onPress?: () => void) => (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center justify-between py-[18px] px-6 bg-white dark:bg-[#1c1c1e] border-b border-gray-100 dark:border-gray-800"
        >
            <Text className={`text-[16px] ${isDestructive ? 'text-red-500' : 'text-[#2d323c] dark:text-gray-200'} font-normal`}>
                {label}
            </Text>
            <View className="flex-row items-center">
                {value && <Text className="text-[#6b7280] dark:text-gray-400 text-[15px] mr-2">{value}</Text>}
                {hasArrow && <Ionicons name="chevron-forward" size={20} color="#6b7280" />}
            </View>
        </TouchableOpacity>
    );

    const renderSectionHeader = (title: string) => (
        <View className="bg-[#eff2f5] dark:bg-[#121212] px-6 py-[14px]">
            <Text className="text-[#68727d] dark:text-gray-400 font-semibold text-[15px]">{title}</Text>
        </View>
    );

    const getAppearanceLabel = () => {
        switch (currentTheme) {
            case 'light': return t('light');
            case 'dark': return t('dark');
            case 'system': return t('system_default');
            default: return t('system_default');
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-black" style={{ paddingTop: insets?.top ?? 0 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* PROFILE HEADER */}
                <View className="px-6 pb-6 pt-4">
                    <View className="flex-row items-center">
                        <Text className="text-gray-900 dark:text-white text-3xl font-black">👋 {t('hi', { defaultValue: 'Hi' })} {userInfo?.name || 'Guest'}</Text>
                    </View>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">{userInfo?.email || 'Login to view details'}</Text>
                </View>

                {/* SAVED / WISHLIST */}
                <View className="bg-white dark:bg-black">
                    <TouchableOpacity
                        onPress={() => router.push("/(tabs)/wishlist")}
                        className="flex-row items-center justify-between py-[18px] px-6 border-b border-gray-100 dark:border-gray-800"
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="heart-outline" size={22} color="#002b5c" />
                            <Text className="text-[#2d323c] dark:text-gray-200 text-[16px] font-medium ml-4">My Wishlist</Text>
                        </View>
                        <View className="flex-row items-center">
                            {/* We could fetch count here, but for now just linking to wishlist is safer than showing 0 if not fetched */}
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* SETTINGS SECTION */}
                {renderSectionHeader(t('settings'))}
                <View>
                    {renderRow(t('profile'), undefined, false, true, () => router.push('/edit-profile'))}
                    {renderRow(t('language'), t('language_name'), false, true, () => setLanguageModalVisible(true))}
                    {renderRow(t('appearance'), getAppearanceLabel(), false, true, () => setAppearanceModalVisible(true))}
                </View>

                {/* SUPPORT SECTION */}
                {renderSectionHeader(t('support'))}
                <View>
                    {renderRow("About TravellersDeal", undefined, false, true, () => Linking.openURL('https://travellersdeal.com/about-us'))}
                    {renderRow("Help Center", undefined, false, true, () => Linking.openURL('https://travellersdeal.com/contact'))}
                </View>

                {/* FEEDBACK SECTION */}
                {renderSectionHeader(t('feedback'))}
                <View>
                    {renderRow("Leave feedback", undefined, false, true, () => {
                        const url = appSettings?.feedbackUrl ||
                            (Platform.OS === 'android' ? appSettings?.playStoreUrl : appSettings?.appStoreUrl);
                        if (url) Linking.openURL(url);
                        else Alert.alert('Coming Soon', 'Feedback link will be available soon.');
                    })}
                    {renderRow("Rate the app", undefined, false, true, () => {
                        const url = Platform.OS === 'android'
                            ? appSettings?.playStoreUrl
                            : appSettings?.appStoreUrl;
                        if (url) Linking.openURL(url);
                        else Alert.alert('Coming Soon', 'App store link will be available soon.');
                    })}
                </View>

                {/* LEGAL SECTION */}
                {renderSectionHeader(t('legal'))}
                <View>
                    {renderRow("General terms and conditions", undefined, false, true, () => Linking.openURL('https://travellersdeal.com/term'))}
                    {renderRow("Privacy Policy", undefined, false, true, () => Linking.openURL('https://travellersdeal.com/privacy-policy'))}
                    {renderRow(t('logout'), undefined, true, false, handleLogout)}
                </View>

                {/* VERSION SECTION */}
                <View className="bg-[#eff2f5] dark:bg-[#121212] px-6 py-6 pb-12">
                    <Text className="text-[#8e97a2] dark:text-gray-500 text-[14px]">{t('version')} 26.2.0</Text>
                </View>

                <View className="h-10" />
            </ScrollView>

            {/* Language Selection Modal */}
            <Modal
                visible={isLanguageModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setLanguageModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-[#2d323c] dark:text-white">{t('select_language')}</Text>
                            <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={languages}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => changeLanguage(item.code)}
                                    className="py-4 border-b border-gray-100 dark:border-gray-800 flex-row justify-between items-center"
                                >
                                    <Text className={`text-lg ${i18n.language === item.code ? 'text-[#002b5c] dark:text-[#58a6ff] font-bold' : 'text-[#2d323c] dark:text-gray-200'}`}>
                                        {item.label}
                                    </Text>
                                    {i18n.language === item.code && (
                                        <Ionicons name="checkmark" size={24} color={currentTheme === 'dark' ? '#58a6ff' : '#002b5c'} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            onPress={() => setLanguageModalVisible(false)}
                            className="mt-4 py-4 bg-gray-100 dark:bg-gray-800 rounded-xl items-center"
                        >
                            <Text className="text-[#2d323c] dark:text-gray-200 font-bold">{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Appearance Selection Modal */}
            <Modal
                visible={isAppearanceModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setAppearanceModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-[#2d323c] dark:text-white">{t('select_appearance')}</Text>
                            <TouchableOpacity onPress={() => setAppearanceModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={appearanceOptions}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => changeAppearance(item.code as any)}
                                    className="py-4 border-b border-gray-100 dark:border-gray-800 flex-row justify-between items-center"
                                >
                                    <Text className={`text-lg ${currentTheme === item.code ? 'text-[#002b5c] dark:text-[#58a6ff] font-bold' : 'text-[#2d323c] dark:text-gray-200'}`}>
                                        {item.label}
                                    </Text>
                                    {currentTheme === item.code && (
                                        <Ionicons name="checkmark" size={24} color={currentTheme === 'dark' ? '#58a6ff' : '#002b5c'} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            onPress={() => setAppearanceModalVisible(false)}
                            className="mt-4 py-4 bg-gray-100 dark:bg-gray-800 rounded-xl items-center"
                        >
                            <Text className="text-[#2d323c] dark:text-gray-200 font-bold">{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}





