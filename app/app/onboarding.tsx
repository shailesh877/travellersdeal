import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen() {
    const router = useRouter();

    const handleLetsGo = async () => {
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            // Check if user is logged in
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (userInfo) {
                router.replace('/(tabs)');
            } else {
                router.replace('/(tabs)'); // The user requested home screen open ho. Usually apps allow browsing without login.
                // Or maybe they want to redirect to tabs index?
                // Let's redirect to /(tabs)
            }
        } catch (e) {
            console.error(e);
            router.replace('/(tabs)');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Let's give you the best experience possible</Text>
                
                <Text style={styles.paragraph}>
                    Travellers Deal uses cookies and other technologies, whether users are browsing our website or using our app. We do this to keep our platforms secure, measure their performance, deliver a personalized experience, improve our services and advertise them more relevantly. To do this, we and our trusted partners collect information about users, their purchases, activity, and their devices. Preferences can be changed at any time with future effect across your devices. For more information, see our <Text style={styles.linkText}>privacy policy</Text>.
                </Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={handleLetsGo}>
                    <Text style={styles.buttonText}>Let's go</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 20,
        lineHeight: 34,
        fontFamily: 'Outfit_700Bold',
    },
    paragraph: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        fontFamily: 'Outfit_400Regular',
    },
    linkText: {
        color: '#0071eb',
        fontWeight: 'bold',
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        paddingTop: 20,
        backgroundColor: '#FFFFFF',
    },
    button: {
        backgroundColor: '#0071eb',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Outfit_700Bold',
    },
    secondaryButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#0071eb',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Outfit_700Bold',
    }
});
