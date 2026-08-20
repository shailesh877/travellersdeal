import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { formatPrice, getDisplayPrice } from '../utils/currency';

interface FullItineraryModalProps {
    visible: boolean;
    onClose: () => void;
    onCheckAvailability?: () => void;
    experience: any;
    isDark: boolean;
}

export default function FullItineraryModal({ visible, onClose, onCheckAvailability, experience, isDark }: FullItineraryModalProps) {
    if (!experience) return null;

    const itinerary = experience.itinerary || [];
    const location = experience.location?.coordinates || null;
    
    // Default region
    const initialRegion = {
        latitude: location ? location[1] : 43.5081,
        longitude: location ? location[0] : 16.4402,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    // Helper to determine icon based on title
    const getIconInfo = (title: string, index: number, isLast: boolean) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('bus') || lowerTitle.includes('coach')) {
            return { name: 'bus-outline', type: 'icon', isMain: false };
        }
        if (lowerTitle.includes('boat') || lowerTitle.includes('cruise')) {
            return { name: 'boat-outline', type: 'icon', isMain: false };
        }
        if (index === 0) {
            return { name: 'ellipse', type: 'circle', isMain: true, color: '#f97316' }; // Orange solid
        }
        if (lowerTitle.includes('optional')) {
            return { name: 'ellipse-outline', type: 'circle', isMain: false, color: '#9ca3af' }; // Gray outline
        }
        return { name: 'location-sharp', type: 'pin', isMain: true, color: '#1e3a8a' }; // Dark blue
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
                {/* Header */}
                <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                    <TouchableOpacity onPress={onClose} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18 }} className="text-black dark:text-white">
                        Itinerary
                    </Text>
                </View>

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>


                    {/* Legend Area */}
                    <View className="flex-row items-center px-5 py-4 border-b border-gray-100 dark:border-gray-900 gap-x-6">
                        <View className="flex-row items-center">
                            <Ionicons name="location-outline" size={16} color="#6b7280" className="mr-2" />
                            <Text style={{ fontFamily: 'Outfit_400Regular' }} className="text-gray-600 dark:text-gray-400">Main stop</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="w-2 h-2 rounded-full bg-gray-500 mr-2" />
                            <Text style={{ fontFamily: 'Outfit_400Regular' }} className="text-gray-600 dark:text-gray-400">Other stop</Text>
                        </View>
                    </View>

                    {/* Timeline Area */}
                    <View className="px-6 py-6">
                        {itinerary.map((item: any, i: number) => {
                            const isLast = i === itinerary.length - 1;
                            const iconInfo = getIconInfo(item.title, i, isLast);
                            
                            return (
                                <View key={i} className="flex-row relative">
                                    {/* Vertical connecting line */}
                                    {!isLast && (
                                        <View className="absolute left-[13px] top-10 bottom-[-20px] w-[3px]">
                                            <View className="flex-1 bg-orange-500 rounded-full" />
                                        </View>
                                    )}

                                    {/* Icon Container */}
                                    <View className="w-7 h-7 mt-1 mr-4 items-center justify-center z-10 bg-white dark:bg-black rounded-full">
                                        {iconInfo.type === 'circle' && (
                                            <View className="w-6 h-6 rounded-full border-[3px]" style={{ 
                                                backgroundColor: iconInfo.name === 'ellipse' ? iconInfo.color : 'transparent',
                                                borderColor: iconInfo.color
                                            }} />
                                        )}
                                        {iconInfo.type === 'icon' && (
                                            <View className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 items-center justify-center bg-white dark:bg-gray-800">
                                                <Ionicons name={iconInfo.name as any} size={16} color={isDark ? '#fff' : '#1a2b49'} />
                                            </View>
                                        )}
                                        {iconInfo.type === 'pin' && (
                                            <View className="w-8 h-8 rounded-full items-center justify-center bg-[#1e3a8a]">
                                                <Ionicons name="location-sharp" size={16} color="#fff" />
                                            </View>
                                        )}
                                    </View>

                                    {/* Text Content */}
                                    <View className="flex-1 pb-8 border-b border-gray-100 dark:border-gray-800 border-dashed mb-2 ml-1">
                                        <Text style={{ fontFamily: 'Outfit_700Bold' }} className="text-gray-900 dark:text-white text-[16px]">
                                            {item.title}
                                        </Text>
                                        {item.description ? (
                                            <Text style={{ fontFamily: 'Outfit_400Regular' }} className="text-gray-500 dark:text-gray-400 mt-1">
                                                {item.description}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Bottom Sticky Bar */}
                <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 px-5 py-4 border-t border-gray-200 dark:border-gray-800 flex-row items-center justify-between">
                    <View>
                        <Text style={{ fontFamily: 'Outfit_400Regular' }} className="text-gray-500 dark:text-gray-400 text-[10px] font-medium mb-0.5">From</Text>
                        <View className="flex-row items-baseline gap-1">
                            <Text style={{ fontFamily: 'Outfit_900Black' }} className="text-[#ef4444] text-[18px] leading-none">
                                {formatPrice(getDisplayPrice(experience), experience.currency)}
                            </Text>
                            <Text style={{ fontFamily: 'Outfit_500Medium' }} className="text-gray-500 dark:text-gray-400 text-[11px]">per person</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        className="bg-[#1a2b49] dark:bg-[#58a6ff] px-4 py-3.5 rounded-full flex-shrink-0 ml-2"
                        activeOpacity={0.8}
                        onPress={onCheckAvailability || onClose}
                    >
                        <Text style={{ fontFamily: 'Outfit_700Bold' }} className="text-white text-sm sm:text-base">Check availability</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}
