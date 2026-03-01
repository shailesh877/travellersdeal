import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface RazorpayOptions {
    key: string;
    amount: number;       // in paise
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    theme?: { color: string };
}

interface Props {
    visible: boolean;
    options: RazorpayOptions;
    onSuccess: (paymentData: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
    onFailure: (error: string) => void;
    onDismiss: () => void;
}

const RAZORPAY_CHECKOUT_HTML = (opts: RazorpayOptions) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }
        .loading { display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 16px; }
        .loader { width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top: 4px solid #002b5c; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        p { color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="loading">
        <div class="loader"></div>
        <p>Opening Razorpay...</p>
    </div>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
        window.onload = function() {
            var options = {
                key: "${opts.key}",
                amount: ${opts.amount},
                currency: "${opts.currency}",
                name: "${opts.name}",
                description: "${opts.description.replace(/"/g, '\\"')}",
                order_id: "${opts.order_id}",
                prefill: {
                    name: "${opts.prefill.name.replace(/"/g, '\\"')}",
                    email: "${opts.prefill.email}",
                    contact: "${opts.prefill.contact}"
                },
                theme: { color: "${opts.theme?.color || '#002b5c'}" },
                modal: {
                    backdropclose: false,
                    escape: false,
                    ondismiss: function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DISMISS' }));
                    }
                },
                handler: function(response) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'SUCCESS',
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature
                    }));
                }
            };

            try {
                var rzp = new Razorpay(options);
                rzp.on('payment.failed', function(response) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'FAILURE',
                        error: response.error.description || 'Payment failed'
                    }));
                });
                rzp.open();
            } catch(e) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'FAILURE',
                    error: 'Failed to initialize: ' + e.message
                }));
            }
        };
    </script>
</body>
</html>
`;

export default function RazorpayWebCheckout({ visible, options, onSuccess, onFailure, onDismiss }: Props) {
    const [loading, setLoading] = React.useState(true);

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'SUCCESS') {
                onSuccess({
                    razorpay_payment_id: data.razorpay_payment_id,
                    razorpay_order_id: data.razorpay_order_id,
                    razorpay_signature: data.razorpay_signature,
                });
            } else if (data.type === 'FAILURE') {
                onFailure(data.error || 'Payment failed');
            } else if (data.type === 'DISMISS') {
                onDismiss();
            }
        } catch (e) {
            console.error('RazorpayWebCheckout message parse error:', e);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Secure Payment</Text>
                    <View style={styles.closeBtn} />
                </View>

                {/* WebView */}
                <WebView
                    source={{ html: RAZORPAY_CHECKOUT_HTML(options) }}
                    onMessage={handleMessage}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    mixedContentMode="always"
                    style={{ flex: 1 }}
                    renderLoading={() => (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#002b5c" />
                            <Text style={styles.loadingText}>Loading Razorpay...</Text>
                        </View>
                    )}
                />

                {/* Security note */}
                <View style={styles.footer}>
                    <Ionicons name="shield-checkmark-outline" size={14} color="#10b981" />
                    <Text style={styles.footerText}>Secured by Razorpay · 256-bit SSL</Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        backgroundColor: '#fff',
    },
    closeBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#002b5c',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: '#9ca3af',
        marginLeft: 6,
    },
});
