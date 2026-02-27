import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Dimensions, Linking, Modal, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "../constants/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RazorpayCheckout from 'react-native-razorpay';
import { formatPrice } from "../utils/currency";

const { width } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
    experience: {
        id: string;
        title: string;
        price: string;
        image: string;
        currency?: string;
    } | null;
    selectedDate: string | null;
    selectedTime: string | null;
}


type Step = 'payment' | 'success';


export default function BookingFlow({ visible, onClose, experience, selectedDate, selectedTime }: Props) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [step, setStep] = useState<Step>('payment');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
    const [loading, setLoading] = useState(false);

    if (!experience) return null;

    const initiateRazorpayPayment = async () => {
        setLoading(true);
        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (!userInfo) {
                Alert.alert("Error", "You must be logged in to book.");
                setLoading(false);
                return;
            }
            const { token, name, email, mobile } = JSON.parse(userInfo); // Assuming user object has these fields directly or strictly inside 'user' key. Let's check AuthContext usage or storage structure. usually it is { token, ...user }.

            // 1. Create Order
            const priceString = String(experience.price || '0');
            const amount = parseFloat(priceString.replace(/,/g, ''));
            const orderRes = await fetch(`${API_URL}/payments/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: Math.round(amount * 100), // in smallest unit
                    currency: experience.currency || "USD" // Ensure backend handles USD conversion if needed or Razorpay supports it
                })
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok) {
                Alert.alert("Error", orderData.message || "Failed to create order");
                setLoading(false);
                return;
            }

            // 2. Get Key
            const keyRes = await fetch(`${API_URL}/payments/key`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { keyId } = await keyRes.json();

            // 3. Open Razorpay
            const options = {
                description: experience.title,
                image: experience.image,
                currency: orderData.currency,
                key: keyId,
                amount: orderData.amount,
                name: "Travellers Deal",
                order_id: orderData.id, // Replace with actual order_id from backend
                prefill: {
                    email: email || 'user@example.com',
                    contact: mobile || '9999999999',
                    name: name || 'Traveller'
                },
                theme: { color: '#002b5c' }
            };

            RazorpayCheckout.open(options).then(async (data: any) => {
                // handle success
                // 4. Verify Payment
                try {
                    const verifyRes = await fetch(`${API_URL}/payments/verify`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            razorpay_order_id: data.razorpay_order_id,
                            razorpay_payment_id: data.razorpay_payment_id,
                            razorpay_signature: data.razorpay_signature
                        })
                    });

                    const verifyData = await verifyRes.json();

                    if (verifyData.status === 'success') {
                        await createBooking(data.razorpay_payment_id);
                    } else {
                        Alert.alert("Payment Verification Failed", "Please contact support if money was deducted.");
                    }
                } catch (verifyError) {
                    console.error("Verification Error", verifyError);
                    Alert.alert("Error", "Payment verified failed locally");
                }
            }).catch((error: any) => {
                // handle failure
                if (error.code === 0) {
                    // Payment cancelled by user, do nothing or show toast
                    console.log("Payment Cancelled");
                } else {
                    Alert.alert("Error", `Payment failed: ${error.description}`);
                }
            });

        } catch (error) {
            console.error("Payment Init Error:", error);
            Alert.alert("Error", "Something went wrong initializing payment");
        } finally {
            setLoading(false);
        }
    };

    const createBooking = async (paymentId: string) => {
        setLoading(true);
        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            const { token } = JSON.parse(userInfo || '{}');

            const priceString = String(experience.price || '0');
            const priceNumeric = parseFloat(priceString.replace(/,/g, ''));

            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    experienceId: experience.id,
                    date: selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString(),
                    slots: 1,
                    timeSlot: selectedTime || "10:00 AM",
                    totalPrice: priceNumeric,
                    paymentStatus: 'paid',
                    paymentId: paymentId
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStep('success');
            } else {
                Alert.alert("Booking Failed", data.message || "Something went wrong.");
            }
        } catch (error) {
            console.error("Booking Error:", error);
            Alert.alert("Error", "Network request failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        if (step === 'payment') {
            initiateRazorpayPayment();
        }
    };

    const handleFinish = () => {
        setStep('payment'); // Reset for next time
        onClose();
        router.push('/(tabs)/bookings');
    };

    const renderHeader = () => (
        <View
            style={{ paddingTop: (insets?.top ?? 0) + 10 }}
            className="flex-row items-center justify-between px-6 pb-4 border-b border-gray-100 dark:border-gray-800"
        >
            <TouchableOpacity onPress={onClose} className="w-10 h-10 items-start justify-center">
                <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text className="text-[#002b5c] dark:text-[#58a6ff] font-black text-lg">
                {step === 'payment' ? 'Payment' : 'Confirmed'}
            </Text>
            <View className="w-10" />
        </View>
    );



    const renderPaymentStep = () => (
        <View className="p-6">
            <View className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm mb-8">
                <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Price Summary</Text>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-gray-400">Package (1 Person)</Text>
                    <Text className="text-gray-900 dark:text-white font-bold">{formatPrice(experience.price, experience.currency || 'USD')}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-gray-400">GST (18%)</Text>
                    <Text className="text-gray-900 dark:text-white font-bold">Included</Text>
                </View>
                <View className="h-[1px] bg-gray-100 dark:bg-gray-800 my-4" />
                <View className="flex-row justify-between items-center">
                    <Text className="text-gray-900 dark:text-white font-black text-lg">Total Amount</Text>
                    <Text className="text-[#002b5c] dark:text-[#58a6ff] font-black text-2xl">{formatPrice(experience.price, experience.currency || 'USD')}</Text>
                </View>
                <View className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold mb-1">SELECTED SLOT</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-base">{selectedDate} at {selectedTime}</Text>
                </View>
            </View>

            <Text className="text-center text-gray-500 dark:text-gray-400 mb-6">
                You will be redirected to Razorpay securely to complete your payment.
                Reference ID: #ORD-{Math.floor(Math.random() * 100000)}
            </Text>
        </View >
    );

    const renderSuccessStep = () => (
        <View className="px-6 items-center justify-center flex-1 py-12">
            <View className="w-24 h-24 bg-green-100 dark:bg-green-950/20 rounded-full items-center justify-center mb-8">
                <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
            </View>
            <Text className="text-gray-900 dark:text-white font-black text-3xl text-center mb-2">Booking Confirmed!</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center text-lg px-4 mb-10 leading-6">
                Pack your bags! Your adventure for <Text className="font-bold text-[#002b5c] dark:text-[#58a6ff]">{selectedDate}</Text> is now official.
            </Text>

            <View className="bg-gray-50 dark:bg-[#1c1c1e] p-6 rounded-3xl w-full border border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center mb-4">
                    <Ionicons name="calendar" size={20} color="#6b7280" />
                    <Text className="text-gray-600 dark:text-gray-300 font-bold ml-3">{selectedDate}</Text>
                </View>
                <View className="flex-row items-center">
                    <Ionicons name="location" size={20} color="#6b7280" />
                    <Text className="text-gray-600 dark:text-gray-300 font-bold ml-3" numberOfLines={1}>{selectedTime}</Text>
                </View>
            </View>
        </View>
    );



    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-white dark:bg-black">
                {renderHeader()}

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    {step === 'payment' && renderPaymentStep()}
                    {step === 'success' && renderSuccessStep()}
                </ScrollView>

                <View
                    style={{ paddingBottom: (insets?.bottom ?? 0) + 16 }}
                    className="px-6 pt-4 border-t border-gray-100 dark:border-gray-800"
                >
                    {step !== 'success' ? (
                        <TouchableOpacity
                            onPress={handleNext}
                            className="w-full py-5 rounded-full items-center shadow-lg bg-[#002b5c] dark:bg-[#58a6ff]"
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-black text-lg">
                                    Pay & Confirm Booking
                                </Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleFinish}
                            className="w-full bg-[#002b5c] dark:bg-[#58a6ff] py-5 rounded-full items-center shadow-lg"
                        >
                            <Text className="text-white text-lg">View in My Bookings</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}
