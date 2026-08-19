import { Ionicons } from "@expo/vector-icons";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useMemo } from "react";
import { Dimensions, Image, Modal, Platform, ScrollView, Text, TouchableOpacity, View, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatPrice } from "../utils/currency";

const { width } = Dimensions.get('window');

interface ItineraryItem {
    title: string;
    description: string;
}

interface Booking {
    _id: string;
    experience: {
        _id: string;
        title: string;
        images: string[];
        location?: { city: string; country: string };
        duration: string;
        itinerary: ItineraryItem[];
        currency?: string;
        bookingOptions?: any[];
    };
    date: string;
    slots?: number;
    totalPrice: number;
    currency?: string;
    status: string;
    paymentStatus: string;
    paymentId?: string;
    tierBreakdown?: { title: string; quantity: number; price: number }[];
    travellerInfo?: { name: string; email: string; phone: string };
    createdAt?: string;
}

interface BookingDisplayItem {
    id: string;
    title: string;
    date: string;
    amount: string;
    status: string;
    image: string;
    itinerary?: any[];
    payment?: any;
    raw: Booking;
}

interface Props {
    visible: boolean;
    booking: Booking | BookingDisplayItem | null;
    onClose: () => void;
}

export default function BookingDetail({ visible, booking, onClose }: Props) {
    const insets = useSafeAreaInsets();

    const displayBooking = useMemo(() => {
        if (!booking) return null;
        if ('raw' in booking) return booking as BookingDisplayItem;
        const b = booking as Booking;
        return {
            id: b._id,
            title: b.experience?.title || 'Trip',
            date: b.date,
            amount: formatPrice(b.totalPrice, b.currency || b.experience?.bookingOptions?.[0]?.availabilityAndPricing?.currency || b.experience?.currency),
            status: b.status,
            image: b.experience?.images?.[0] || '',
            itinerary: b.experience?.itinerary?.map(i => ({
                title: i.title,
                description: i.description,
                location: b.experience?.location?.city || '',
                time: 'N/A'
            })),
            payment: {
                total: formatPrice(b.totalPrice, b.currency || b.experience?.bookingOptions?.[0]?.availabilityAndPricing?.currency || b.experience?.currency),
                transactionId: b.paymentId
            },
            raw: b
        } as unknown as BookingDisplayItem;
    }, [booking]);

    // Derived state
    const actualBooking = (booking as any)?.raw || booking;
    const experience = actualBooking?.experience || {};

    if (!visible || !displayBooking) {
        return null;
    }

    const getStatusColor = (status: string) => {
        if (!status) return '#6b7280';
        switch (status.toLowerCase()) {
            case 'confirmed': return '#22c55e';
            case 'pending': return '#f97316';
            case 'completed': return '#3b82f6';
            case 'cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getTicketHtml = () => {
        if (!displayBooking) return '';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                <style>
                    body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #002b5c; padding-bottom: 20px; margin-bottom: 30px; }
                    .title { color: #002b5c; font-size: 28px; font-weight: bold; margin: 0; }
                    .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
                    .section { margin-bottom: 25px; }
                    .section-title { font-size: 18px; font-weight: bold; color: #002b5c; border-left: 4px solid #002b5c; padding-left: 10px; margin-bottom: 15px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                    .info-item { margin-bottom: 10px; }
                    .label { color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; }
                    .value { font-size: 14px; font-weight: bold; }
                    .itinerary-item { border-left: 2px solid #ddd; padding-left: 15px; margin-bottom: 15px; position: relative; }
                    .itinerary-item::before { content: ''; width: 8px; height: 8px; background: #002b5c; border-radius: 50%; position: absolute; left: -5px; top: 5px; }
                    .payment-box { background: #f8f9fa; padding: 20px; border-radius: 10px; }
                    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="title">TRAVELLERS DEAL</h1>
                    <p class="subtitle">E-Ticket & Booking Confirmation</p>
                    <p class="subtitle" style="font-size: 12px; margin-top: 10px;">Generated on: ${new Date().toLocaleString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</p>
                </div>

                <div class="section">
                    <div class="section-title">Booking Information</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="label">Booking ID</div>
                            <div class="value">${displayBooking.id}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">Status</div>
                            <div class="value" style="color: ${getStatusColor(displayBooking.status)}">${displayBooking.status.toUpperCase()}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">Experience</div>
                            <div class="value">${displayBooking.title}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">Experience Date</div>
                            <div class="value">${new Date(displayBooking.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                        ${actualBooking.createdAt ? `
                        <div class="info-item">
                            <div class="label">Booked On</div>
                            <div class="value">${new Date(actualBooking.createdAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>` : ''}
                        ${actualBooking.travellerInfo?.name ? `
                        <div class="info-item">
                            <div class="label">Primary Traveller</div>
                            <div class="value">${actualBooking.travellerInfo.name}</div>
                        </div>` : ''}
                        ${actualBooking.tierBreakdown && actualBooking.tierBreakdown.length > 0 ? `
                        <div class="info-item" style="grid-column: span 2;">
                            <div class="label">Participants</div>
                            <div class="value">
                                ${actualBooking.tierBreakdown?.length > 0
                    ? actualBooking.tierBreakdown.map((t: any) => `${t.quantity}x ${t.title} (${formatPrice(t.price * t.quantity, experience.currency)})`).join('<br/>')
                    : `${actualBooking.adultCount || 1}x Adult <br/> ${actualBooking.childCount ? actualBooking.childCount + 'x Child' : ''}`
                }
                            </div>
                        </div>` : `
                        <div class="info-item">
                            <div class="label">Members (Tickets)</div>
                            <div class="value">${actualBooking.slots || 1}</div>
                        </div>`}
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Payment Summary</div>
                    <div class="payment-box">
                        <div class="info-grid">
                            <div class="row">
                                <div class="label">Subtotal</div>
                                <div class="value">${formatPrice((actualBooking.totalPrice / 1.18).toFixed(2), actualBooking.currency || experience?.bookingOptions?.[0]?.availabilityAndPricing?.currency || experience?.currency).replace('$', '')}</div>
                            </div>
                            <div class="row">
                                <div class="label">Taxes & Fees (GST 18%)</div>
                                <div class="value">${formatPrice((actualBooking.totalPrice - (actualBooking.totalPrice / 1.18)).toFixed(2), actualBooking.currency || experience?.bookingOptions?.[0]?.availabilityAndPricing?.currency || experience?.currency).replace('$', '')}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Total Amount Paid</div>
                                <div class="value" style="font-size: 20px; color: #002b5c;">${displayBooking.payment?.total}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Transaction ID</div>
                                <div class="value">${displayBooking.payment?.transactionId}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank you for booking with Travellers Deal!</p>
                    <p>For support, please contact help@travellersdeal.com</p>
                </div>
            </body>
            </html>
        `;
    };

    const handleDownloadTicket = async () => {
        const htmlContent = getTicketHtml();
        if (!htmlContent) return;

        try {
            await Print.printAsync({
                html: htmlContent,
            });
        } catch (error) {
            console.error('Error printing ticket:', error);
        }
    };

    const handleShareTicket = async () => {
        const htmlContent = getTicketHtml();
        if (!htmlContent) return;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Share your Booking Ticket'
                });
            } else {
                alert('Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Error sharing ticket:', error);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-gray-50 dark:bg-black" style={Platform.OS === 'web' ? { height: '100vh' as any, maxHeight: '100vh' as any } : {}}>
                {/* HEADER */}
                <View
                    style={{ paddingTop: (insets?.top ?? 0) + 10 }}
                    className="bg-white dark:bg-[#1c1c1e] px-6 pb-6 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 shadow-sm"
                >
                    <TouchableOpacity onPress={onClose} className="w-10 h-10 items-start justify-center">
                        <Ionicons name="chevron-down" size={28} color="#6b7280" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 dark:text-white font-extrabold text-lg">Booking Details</Text>
                    <TouchableOpacity className="w-10 items-end justify-center">
                        <Ionicons name="help-circle-outline" size={24} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
                    {/* OVERVIEW CARD */}
                    <View className="bg-white dark:bg-[#1c1c1e] m-6 rounded-3xl p-6 shadow-sm border border-transparent dark:border-gray-800">
                        <Text className="text-gray-900 dark:text-white font-extrabold text-xl mb-4">{displayBooking.title}</Text>
                        <View className="flex-row items-center justify-between mb-4 border-b border-gray-50 dark:border-gray-800 pb-4">
                            <View>
                                <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Status</Text>
                                <Text style={{ color: getStatusColor(booking?.status || "") }} className="font-black text-2xl uppercase italic">
                                    {booking?.status || "Unknown"}
                                </Text>
                            </View>
                            <View className="w-14 h-14 rounded-full items-center justify-center bg-gray-50 dark:bg-gray-800">
                                <Ionicons name="checkmark-circle" size={32} color={getStatusColor(booking?.status || "")} />
                            </View>
                        </View>
                        <View className="flex-row items-center mb-3">
                            <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-3">
                                <Ionicons name="calendar" size={18} color="#002b5c" />
                            </View>
                            <View>
                                <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest">Experience Date</Text>
                                <Text className="text-gray-900 dark:text-white font-bold text-sm">
                                    {new Date(displayBooking.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                                </Text>
                            </View>
                        </View>
                        {actualBooking.createdAt && (
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 items-center justify-center mr-3">
                                    <Ionicons name="time-outline" size={18} color="#10b981" />
                                </View>
                                <View>
                                    <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest">Booked On</Text>
                                    <Text className="text-gray-900 dark:text-white font-bold text-sm">
                                        {new Date(actualBooking.createdAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* TRAVELLER DETAILS */}
                    <View className="px-6 mb-8 mt-2">
                        <Text className="text-gray-900 dark:text-white font-black text-xl mb-4">Traveller Details</Text>
                        <View className="bg-white dark:bg-[#1c1c1e] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                            {actualBooking.travellerInfo?.name && (
                                <View className="mb-4 border-b border-gray-50 dark:border-gray-800 pb-3">
                                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Primary Traveller</Text>
                                    <Text className="text-gray-900 dark:text-white font-medium">{actualBooking.travellerInfo.name}</Text>
                                </View>
                            )}
                            {actualBooking.tierBreakdown && actualBooking.tierBreakdown.length > 0 ? (
                                <View>
                                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Participant Breakdown</Text>
                                    {actualBooking.tierBreakdown.map((tier: any, idx: number) => (
                                        <View key={idx} className="flex-row justify-between mb-1">
                                            <Text className="text-gray-700 dark:text-gray-300 text-sm">{tier.quantity} x {tier.title}</Text>
                                            <View className="items-end">
                                                <Text className="text-gray-900 dark:text-white font-bold text-sm">{formatPrice(tier.price * tier.quantity, experience.currency)}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View>
                                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Tickets</Text>
                                    <Text className="text-gray-900 dark:text-white font-medium">{actualBooking.slots || 1} Guest(s)</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* ITINERARY SECTION */}
                    <View className="px-6 mb-8">
                        <Text className="text-gray-900 dark:text-white font-black text-xl mb-6">Itinerary</Text>

                        {Array.isArray(experience.itinerary) && experience.itinerary.map((item: any, index: number) => (
                            <View key={index} className="flex-row">
                                <View className="items-center mr-4">
                                    <View
                                        className={`w-4 h-4 rounded-full z-10 border-4 border-white dark:border-gray-900 shadow-sm ${index === 0 ? 'bg-[#002b5c] dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                    />
                                    {index !== (experience.itinerary?.length || 0) - 1 && (
                                        <View className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-800 -my-1" />
                                    )}
                                </View>
                                <View className="flex-1 pb-8">
                                    <View className="flex-row justify-between items-start">
                                        <Text className="text-gray-900 dark:text-white font-bold text-base leading-tight flex-1">{item?.title || "Untitled"}</Text>
                                        {item?.time && (
                                            <Text className="text-[#002b5c] dark:text-[#58a6ff] font-black text-xs ml-2">{item.time}</Text>
                                        )}
                                    </View>
                                    {item?.location && (
                                        <View className="flex-row items-center mt-1">
                                            <Ionicons name="location-sharp" size={12} color="#6b7280" />
                                            <Text className="text-gray-500 dark:text-gray-400 text-xs ml-1">{item.location}</Text>
                                        </View>
                                    )}
                                    {item?.description && (
                                        <Text className="text-gray-600 dark:text-gray-400 text-sm mt-2 leading-tight">
                                            {item.description}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>



                    {/* PAYMENT DETAILS */}
                    <View className="bg-white dark:bg-[#1c1c1e] rounded-3xl m-6 p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <Text className="text-gray-900 dark:text-white font-black text-xl mb-6">Payment Summary</Text>

                        {/* Price Summary */}
                        <View className="bg-gray-50 dark:bg-gray-900/30 rounded-2xl p-4 mb-6">
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-gray-500 dark:text-gray-400 font-medium">Subtotal</Text>
                                <Text className="text-gray-900 dark:text-white font-semibold">{formatPrice((actualBooking.totalPrice / 1.18).toFixed(2), actualBooking.currency || experience?.bookingOptions?.[0]?.availabilityAndPricing?.currency || experience?.currency)}</Text>
                            </View>
                            <View className="flex-row justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
                                <Text className="text-gray-500 dark:text-gray-400 font-medium">Taxes & Fees (18%)</Text>
                                <Text className="text-gray-900 dark:text-white font-semibold">{formatPrice((actualBooking.totalPrice - (actualBooking.totalPrice / 1.18)).toFixed(2), actualBooking.currency || experience?.bookingOptions?.[0]?.availabilityAndPricing?.currency || experience?.currency)}</Text>
                            </View>
                            <View className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                            <View className="flex-row justify-between items-center pt-4">
                                <Text className="text-gray-900 dark:text-white font-bold text-lg">Total Paid</Text>
                                <Text className="text-[#002b5c] dark:text-[#58a6ff] font-bold text-xl">{formatPrice(actualBooking.totalPrice, actualBooking.currency || experience?.bookingOptions?.[0]?.availabilityAndPricing?.currency || experience?.currency)}</Text>
                            </View>
                        </View>

                        {/* Payment Status */}
                        <View className="mb-6">
                            <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Payment Status</Text>
                            <View className="flex-row items-center">
                                <Ionicons
                                    name={actualBooking.paymentStatus === 'paid' ? 'checkmark-circle' : 'time-outline'}
                                    size={24}
                                    color={actualBooking.paymentStatus === 'paid' ? '#10b981' : '#f59e0b'}
                                />
                                <Text className={`ml-2 font-semibold ${actualBooking.paymentStatus === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                                    }`}>
                                    {actualBooking.paymentStatus === 'paid' ? 'Payment Successful' : 'Payment Pending'}
                                </Text>
                            </View>
                            {actualBooking.paymentId && (
                                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                                    Payment ID: {actualBooking.paymentId}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* ACTIONS */}
                    <View className="px-6 mb-12 flex-row gap-4">
                        <TouchableOpacity
                            onPress={handleDownloadTicket}
                            className="flex-1 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-800 py-4 rounded-2xl items-center shadow-sm"
                        >
                            <Ionicons name="download-outline" size={20} color="#6b7280" />
                            <Text className="text-[#002b5c] dark:text-[#58a6ff] font-black text-[10px] mt-1 uppercase tracking-tighter">Ticket</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Linking.openURL('https://travellersdeal.com/contact')}
                            className="flex-1 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-800 py-4 rounded-2xl items-center shadow-sm"
                        >
                            <Ionicons name="chatbox-outline" size={20} color="#6b7280" />
                            <Text className="text-gray-700 dark:text-gray-400 font-bold text-xs mt-1">Support</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleShareTicket} className="flex-1 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-800 py-4 rounded-2xl items-center shadow-sm">
                            <Ionicons name="share-social-outline" size={20} color="#6b7280" />
                            <Text className="text-gray-700 dark:text-gray-400 font-bold text-xs mt-1">Share</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}
