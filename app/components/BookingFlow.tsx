import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "../constants/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatPrice, getAdultPrice, getChildPrice, getDisplayPrice } from "../utils/currency";
import RazorpayWebCheckout from "./RazorpayWebCheckout";

interface Props {
    visible: boolean;
    onClose: () => void;
    experience: {
        id?: string;
        _id?: string;
        title: string;
        price: string;
        image: string;
        currency?: string;
        rating?: number | string;
        bookingOptions?: any[];
    } | null;
    selectedDate: string | null;
    selectedTime: string | null;
    adultCount: number;
    childCount?: number;
    tierCounts?: { [key: number]: number };
    cartItems?: any[];
    selectedOptionIndex?: number;
}

type Step = 'form' | 'success';

export default function BookingFlow({ visible, onClose, experience, selectedDate, selectedTime, adultCount = 1, childCount = 0, tierCounts, cartItems, selectedOptionIndex = 0 }: Props) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [step, setStep] = useState<Step>('form');
    const [loadingOnline, setLoadingOnline] = useState(false);
    const [loadingLater, setLoadingLater] = useState(false);
    const [paymentModeUsed, setPaymentModeUsed] = useState<'online' | 'later'>('online');
    const [razorpayOpts, setRazorpayOpts] = useState<any>(null);
    const [showRazorpay, setShowRazorpay] = useState(false);
    const [pendingToken, setPendingToken] = useState<string>('');

    // Traveller info — pre-filled from stored user data
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (visible) {
            loadUserInfo();
        }
    }, [visible]);

    const loadUserInfo = async () => {
        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (userInfo) {
                const parsed = JSON.parse(userInfo);
                setName(parsed.name || '');
                setEmail(parsed.email || '');
                setPhone(parsed.mobile || parsed.phone || '');
            }
        } catch (e) {
            console.error('Failed to load user info', e);
        }
    };

    if (!experience) return null;

    const currency = experience.bookingOptions?.[selectedOptionIndex]?.availabilityAndPricing?.currency || experience.currency || 'USD';

    const getDynamicTiers = () => {
        let tiersToRender: any = [];
        const displayExp: any = experience;
        if (displayExp?.bookingOptions?.length > selectedOptionIndex) {
            const opt = displayExp.bookingOptions[selectedOptionIndex];
            if (opt?.availabilityAndPricing?.pricingTiers?.length > 0) {
                tiersToRender = opt.availabilityAndPricing.pricingTiers;
            } else {
                tiersToRender = [{ title: 'Adult', price: opt?.availabilityAndPricing?.price || getAdultPrice(displayExp) }];
            }
        } else {
            tiersToRender = [{ title: 'Adult (Age 13+)', price: getAdultPrice(displayExp) }];
            if (getChildPrice(displayExp) > 0) {
                tiersToRender.push({ title: 'Child', price: getChildPrice(displayExp) });
            }
        }
        return tiersToRender;
    };

    let computedBaseAmount = 0;
    let totalQuantity = 0;
    let participantsString = '';
    const tierBreakdown: any[] = [];

    if (cartItems && cartItems.length > 0) {
        // Bulk Cart Checkout Calculation
        totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
        computedBaseAmount = cartItems.reduce((acc, item) => acc + ((item.priceAtAdd || getDisplayPrice(item.experience || experience)) * item.quantity), 0);
        participantsString = `${totalQuantity} Items in Cart`;
    } else {
        // Single Experience Checkout Calculation
        if (tierCounts && Object.keys(tierCounts).length > 0) {
            const tiers = getDynamicTiers();
            tiers.forEach((tier: any, index: number) => {
                const count = tierCounts[index] || 0;
                if (count > 0) {
                    const price = parseFloat(tier.price) || 0;
                    totalQuantity += count;
                    computedBaseAmount += (price * count);
                    participantsString += `${count} ${tier.title} + `;
                    tierBreakdown.push({ title: tier.title, quantity: count, price: price });
                }
            });
            if (participantsString.endsWith(' + ')) {
                participantsString = participantsString.slice(0, -3);
            }
        } else {
            const adultUnitAmount = getAdultPrice(experience);
            const childUnitAmount = getChildPrice(experience);
            totalQuantity = adultCount + (childCount || 0);
            computedBaseAmount = (adultUnitAmount * adultCount) + (childUnitAmount * (childCount || 0));
            participantsString = `${adultCount} ${adultCount === 1 ? 'Adult' : 'Adults'} ${(childCount || 0) > 0 ? ` + ${childCount} ${childCount === 1 ? 'Child' : 'Children'}` : ''}`;
            
            tierBreakdown.push({ title: 'Adult', quantity: adultCount, price: adultUnitAmount });
            if (childCount && childCount > 0) {
                tierBreakdown.push({ title: 'Child', quantity: childCount, price: childUnitAmount });
            }
        }
    }

    const baseAmount = computedBaseAmount;
    const gstAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;
    const originalAmount = Math.round(baseAmount * 1.18); // show crossed-out original (18% higher)
    const discount = originalAmount - baseAmount;

    const getAuthToken = async (): Promise<string | null> => {
        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (!userInfo) return null;
            const parsed = JSON.parse(userInfo);
            return parsed.token || null;
        } catch {
            return null;
        }
    };

    const createBooking = async (paymentId: string | null, paymentStatus: 'paid' | 'pending') => {
        const token = await getAuthToken();
        if (!token) {
            Alert.alert("Login Required", "Please log in to complete your booking.");
            return false;
        }

        try {
            let endpoint = `${API_URL}/bookings`;
            let body: any = {
                experienceId: experience.id,
                date: selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString(),
                slots: adultCount + childCount,
                adultCount: adultCount,
                childCount: childCount,
                timeSlot: selectedTime || '',
                totalPrice: totalAmount,
                paymentStatus,
                paymentId: paymentId || undefined,
                tierBreakdown: tierBreakdown,
                travellerInfo: { name, email, phone },
                currency
            };

            if (cartItems && cartItems.length > 0) {
                endpoint = `${API_URL}/bookings/cart`;
                body = {
                    paymentStatus,
                    paymentId: paymentId || undefined,
                    travellerInfo: { name, email, phone },
                    items: cartItems.map(item => ({
                        experienceId: item.experience?._id || item.experience,
                        date: item.date,
                        timeSlot: item.timeSlot,
                        slots: item.quantity,
                        totalPrice: item.priceAtAdd * item.quantity + (item.priceAtAdd * item.quantity * 0.18), // individual total including tax
                        currency: item.experience?.bookingOptions?.[0]?.availabilityAndPricing?.currency || item.experience?.currency || 'USD'
                    })),
                    currency
                };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (response.ok) {
                return true;
            } else {
                Alert.alert("Booking Failed", data.message || "Something went wrong. Please try again.");
                return false;
            }
        } catch (error) {
            console.error("Booking Error:", error);
            Alert.alert("Error", "Network request failed. Check your internet connection.");
            return false;
        }
    };

    const handlePayOnline = async () => {
        setLoadingOnline(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                Alert.alert('Login Required', 'Please log in to continue.');
                return;
            }

            // 1. Create Razorpay order
            const orderRes = await fetch(`${API_URL}/payments/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ amount: Math.round(totalAmount * 100), currency })
            });
            const orderData = await orderRes.json();
            if (!orderRes.ok) {
                Alert.alert('Error', orderData.message || 'Failed to create order');
                return;
            }

            // 2. Get Razorpay key
            const keyRes = await fetch(`${API_URL}/payments/key`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { keyId } = await keyRes.json();

            // 3. Store options and open WebView checkout
            const opts = {
                key: keyId,
                amount: orderData.amount,
                currency: orderData.currency || 'INR',
                name: 'Travellers Deal',
                description: experience.title,
                order_id: orderData.id,
                prefill: {
                    name: (name || 'Traveller').trim(),
                    email: email || 'user@travellersdeal.com',
                    contact: (phone && phone.replace(/\D/g, '').length >= 10)
                        ? phone.replace(/\D/g, '')
                        : '9999999999',
                },
                theme: { color: '#002b5c' }
            };
            setPendingToken(token);
            setRazorpayOpts(opts);
            setShowRazorpay(true);

        } catch (error) {
            console.error('Pay Online Error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoadingOnline(false);
        }
    };

    const handleRazorpaySuccess = async (data: any) => {
        setShowRazorpay(false);
        setLoadingOnline(true);
        try {
            const verifyRes = await fetch(`${API_URL}/payments/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pendingToken}` },
                body: JSON.stringify({
                    razorpay_order_id: data.razorpay_order_id,
                    razorpay_payment_id: data.razorpay_payment_id,
                    razorpay_signature: data.razorpay_signature
                })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.status === 'success') {
                const ok = await createBooking(data.razorpay_payment_id, 'paid');
                if (ok) {
                    setPaymentModeUsed('online');
                    setStep('success');
                }
            } else {
                Alert.alert('Verification Failed', 'Please contact support if amount was deducted.');
            }
        } catch (e) {
            Alert.alert('Error', 'Payment verification failed.');
        } finally {
            setLoadingOnline(false);
        }
    };

    const handlePayLater = () => {
        Alert.alert(
            "Reserve Now, Pay Later",
            `Your spot will be reserved for ${selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'your selected date'}. Payment of ${formatPrice(totalAmount.toString(), currency)} will be collected on arrival.`,
            [
                { text: "Go Back", style: "cancel" },
                {
                    text: "Confirm Reserve",
                    onPress: async () => {
                        setLoadingLater(true);
                        try {
                            const ok = await createBooking(null, 'pending');
                            if (ok) {
                                setPaymentModeUsed('later');
                                setStep('success');
                            }
                        } finally {
                            setLoadingLater(false);
                        }
                    }
                }
            ]
        );
    };

    const handleClose = () => {
        setStep('form');
        setPaymentModeUsed('online');
        onClose();
    };

    const handleViewBookings = () => {
        handleClose();
        router.push('/(tabs)/bookings');
    };

    const renderForm = () => (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <View className="p-5">

                {/* Experience Summary Card */}
                <View className="bg-gray-50 dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 rounded-3xl p-5 mb-5">
                    <Text className="text-red-500 dark:text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">Experience</Text>
                    <Text className="text-gray-900 dark:text-white font-black text-lg mb-1">{experience.title}</Text>
                    {!!experience.rating && (
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text className="text-gray-600 dark:text-gray-400 text-xs ml-1">{experience.rating} · Travellers Deal Verified</Text>
                        </View>
                    )}
                    <View className="h-[1px] bg-gray-200 dark:bg-gray-700 my-3" />

                    <View className="flex-row items-center mb-2">
                        <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-3">
                            <Ionicons name="calendar-outline" size={16} color="#002b5c" />
                        </View>
                        <View>
                            <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase">Date</Text>
                            <Text className="text-gray-900 dark:text-white font-bold text-sm">{cartItems?.length ? 'Multiple Dates' : selectedDate ? new Date(selectedDate).toDateString() : 'Select Date'}</Text>
                        </View>
                    </View>

                    {cartItems?.length || selectedTime ? (
                        <View className="flex-row items-center mb-2">
                            <View className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center mr-3">
                                <Ionicons name="time-outline" size={16} color="#ef4444" />
                            </View>
                            <View>
                                <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase">Time</Text>
                                <Text className="text-gray-900 dark:text-white font-bold text-sm">{cartItems?.length ? 'Multiple Slots' : selectedTime}</Text>
                            </View>
                        </View>
                    ) : null}
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 items-center justify-center mr-3">
                            <Ionicons name="people-outline" size={16} color="#7c3aed" />
                        </View>
                        <View>
                            <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase">Participants</Text>
                            <Text className="text-gray-900 dark:text-white font-bold text-sm">
                                {participantsString}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Traveller Information */}
                <Text className="text-gray-900 dark:text-white font-black text-base mb-3">Traveller information</Text>
                <View className="mb-4">
                    <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Full Name</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Your full name"
                        placeholderTextColor="#9ca3af"
                        className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-[#1c1c1e]"
                    />
                </View>
                <View className="mb-4">
                    <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Email</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="your@email.com"
                        placeholderTextColor="#9ca3af"
                        className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-[#1c1c1e]"
                    />
                </View>
                <View className="mb-6">
                    <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Phone (Optional)</Text>
                    <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholder="+91 00000 00000"
                        placeholderTextColor="#9ca3af"
                        className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-[#1c1c1e]"
                    />
                </View>

                {/* What's included */}
                <Text className="text-gray-900 dark:text-white font-black text-base mb-3">What's included</Text>
                <View className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 mb-6 shadow-sm">
                    {['Free cancellation up to 24 hours before', 'Reserve now, pay nothing today', 'Instant confirmation', 'Secure payment powered by Razorpay'].map((item, i) => (
                        <View key={i} className="flex-row items-start mb-2" style={{ marginBottom: i === 3 ? 0 : 8 }}>
                            <Ionicons name="checkmark" size={18} color="#22c55e" style={{ marginRight: 8, marginTop: 1 }} />
                            <Text className="text-gray-700 dark:text-gray-300 flex-1 leading-5">{item}</Text>
                        </View>
                    ))}
                </View>

                {/* Price Summary */}
                <View className="bg-gray-50 dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 rounded-3xl p-5 mb-6">
                    <Text className="text-gray-900 dark:text-white font-black text-base mb-4">Price summary</Text>

                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-gray-600 dark:text-gray-400">
                            {totalQuantity} {totalQuantity === 1 ? 'person' : 'people'}
                        </Text>
                        <View className="items-end">
                            <Text className="text-gray-400 line-through text-sm">{formatPrice(originalAmount.toString(), currency)}</Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-green-600 dark:text-green-400 font-bold">🏷️ Special Discount</Text>
                        <Text className="text-green-600 dark:text-green-400 font-bold">−{formatPrice(discount.toString(), currency)}</Text>
                    </View>

                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-gray-600 dark:text-gray-400">Price after discount</Text>
                        <Text className="text-gray-900 dark:text-white font-medium">{formatPrice(baseAmount.toString(), currency)}</Text>
                    </View>

                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-gray-600 dark:text-gray-400">GST (18%)</Text>
                        <Text className="text-gray-900 dark:text-white font-medium">+{formatPrice(gstAmount.toString(), currency)}</Text>
                    </View>

                    <View className="h-[1px] bg-gray-200 dark:bg-gray-700 mb-3" />

                    <View className="flex-row justify-between items-center">
                        <Text className="text-gray-900 dark:text-white font-black text-lg">Total</Text>
                        <View className="items-end">
                            <Text className="text-gray-900 dark:text-white font-black text-2xl">
                                {formatPrice(totalAmount.toString(), currency)}
                            </Text>
                            <Text className="text-gray-400 text-xs">Including GST</Text>
                        </View>
                    </View>

                    </View>

                {/* Action Buttons */}
                <TouchableOpacity
                    onPress={handlePayOnline}
                    disabled={loadingOnline || loadingLater}
                    className="w-full bg-red-500 py-5 rounded-2xl items-center mb-3 flex-row justify-center"
                    style={{ backgroundColor: '#e74c3c' }}
                >
                    {loadingOnline ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="lock-closed" size={18} color="white" style={{ marginRight: 8 }} />
                            <Text className="text-white font-black text-lg">
                                Pay {formatPrice(totalAmount.toString(), currency)} with Razorpay
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <View className="flex-row items-center mb-3">
                    <View className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-700" />
                    <Text className="text-gray-400 mx-3 text-xs font-bold">OR</Text>
                    <View className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-700" />
                </View>

                <TouchableOpacity
                    onPress={handlePayLater}
                    disabled={loadingOnline || loadingLater}
                    className="w-full border-2 border-red-500 py-5 rounded-2xl items-center mb-5 flex-row justify-center"
                    style={{ borderColor: '#e74c3c' }}
                >
                    {loadingLater ? (
                        <ActivityIndicator color="#e74c3c" />
                    ) : (
                        <>
                            <Ionicons name="calendar-outline" size={18} color="#e74c3c" style={{ marginRight: 8 }} />
                            <Text className="font-black text-lg" style={{ color: '#e74c3c' }}>
                                Reserve Now, Pay Later
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Security Badges */}
                <View className="items-center mb-2">
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="shield-checkmark-outline" size={14} color="#10b981" />
                        <Text className="text-gray-500 dark:text-gray-400 text-xs ml-1">Secured by 256-bit SSL encryption</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                        {['UPI', 'CARDS', 'NET BANKING', 'WALLETS'].map((badge, idx) => (
                            <View key={badge} style={{ marginRight: idx < 3 ? 6 : 0, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 }}>
                                <Text style={{ color: '#9ca3af', fontSize: 10, fontWeight: 'bold' }}>{badge}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View className="h-8" />
            </View>
        </ScrollView>
    );

    const renderSuccess = () => (
        <View className="flex-1 px-6 items-center justify-center py-12">
            <View className={`w-24 h-24 rounded-full items-center justify-center mb-8 ${paymentModeUsed === 'later' ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
                <Ionicons
                    name={paymentModeUsed === 'later' ? "time-outline" : "checkmark-circle"}
                    size={64}
                    color={paymentModeUsed === 'later' ? "#f59e0b" : "#22c55e"}
                />
            </View>
            <Text className="text-gray-900 dark:text-white font-black text-3xl text-center mb-3">
                {paymentModeUsed === 'later' ? 'Booking Reserved!' : 'Booking Confirmed!'}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center text-base px-4 mb-8 leading-6">
                {paymentModeUsed === 'later'
                    ? `Your spot for ${selectedDate} is reserved. Please bring payment on arrival.`
                    : `Pack your bags! Your adventure for ${selectedDate} is all set.`}
            </Text>

            <View className="bg-gray-50 dark:bg-[#1c1c1e] p-5 rounded-3xl w-full border border-gray-100 dark:border-gray-800 mb-4">
                <View className="flex-row items-center mb-3">
                    <Ionicons name="calendar" size={18} color="#6b7280" />
                    <Text className="text-gray-700 dark:text-gray-300 font-bold ml-3">{selectedDate}{selectedTime ? ` · ${selectedTime}` : ''}</Text>
                </View>
                <View className="flex-row items-center mb-3">
                    <Ionicons name="people-outline" size={18} color="#6b7280" />
                    <Text className="text-gray-700 dark:text-gray-300 font-bold ml-3">{totalQuantity} {totalQuantity === 1 ? 'Guest' : 'Guests'}</Text>
                </View>
                <View className="flex-row items-center">
                    <Ionicons name="wallet-outline" size={18} color="#6b7280" />
                    <Text className="text-gray-700 dark:text-gray-300 font-bold ml-3">
                        {formatPrice(totalAmount.toString(), currency)} · {paymentModeUsed === 'later' ? 'Pay on arrival' : 'Paid online'}
                    </Text>
                </View>
            </View>

            {paymentModeUsed === 'later' && (
                <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-2xl w-full">
                    <View className="flex-row items-center">
                        <Ionicons name="information-circle-outline" size={18} color="#f59e0b" />
                        <Text className="text-amber-700 dark:text-amber-400 font-bold ml-2 text-sm flex-1">
                            Please carry {formatPrice(totalAmount.toString(), currency)} on the day of your activity.
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <>
            <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
                <View className="flex-1 bg-white dark:bg-black">

                    {/* Header */}
                    <View style={{ paddingTop: (insets?.top ?? 0) + 10 }}
                        className="flex-row items-center justify-between px-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <TouchableOpacity onPress={handleClose} className="w-10 h-10 items-start justify-center">
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                        <Text className="text-[#002b5c] dark:text-[#58a6ff] font-black text-lg">
                            {step === 'form' ? 'Confirm your booking' : 'Booking Confirmed!'}
                        </Text>
                        <View className="w-10" />
                    </View>

                    {step === 'form' ? renderForm() : (
                        <>
                            <ScrollView className="flex-1">{renderSuccess()}</ScrollView>
                            <View style={{ paddingBottom: (insets?.bottom ?? 0) + 16 }} className="px-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <TouchableOpacity onPress={handleViewBookings} className="w-full bg-[#002b5c] dark:bg-[#58a6ff] py-5 rounded-full items-center justify-center">
                                    <Text className="text-white font-black text-base text-center">View My Bookings</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </Modal>

            {/* Razorpay WebView Checkout */}
            {showRazorpay && razorpayOpts && (
                <RazorpayWebCheckout
                    visible={showRazorpay}
                    options={razorpayOpts}
                    onSuccess={handleRazorpaySuccess}
                    onFailure={(err) => {
                        setShowRazorpay(false);
                        Alert.alert('Payment Failed', err);
                    }}
                    onDismiss={() => setShowRazorpay(false)}
                />
            )}
        </>
    );
}
