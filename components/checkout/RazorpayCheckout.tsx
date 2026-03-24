'use client';

import { useState } from 'react';
import { useRazorpay, createRazorpayOrder } from '@/hooks/useRazorpay';
import { CreditCard, AlertCircle, Loader2 } from 'lucide-react';

interface RazorpayCheckoutProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentId: string, orderId: string) => void;
  onError: (error: string) => void;
  customerDetails?: {
    name: string;
    email: string;
    phone?: string;
  };
  orderDetails?: {
    receipt: string;
    description: string;
  };
}

/**
 * Razorpay Checkout Component
 * Handles secure payment processing using Razorpay
 * 
 * Usage:
 * <RazorpayCheckout
 *   amount={1000}
 *   currency="INR"
 *   onSuccess={(paymentId, orderId) => console.log('Payment successful')}
 *   onError={(error) => console.log('Payment failed')}
 *   customerDetails={{ name: 'John Doe', email: 'john@example.com' }}
 *   orderDetails={{ receipt: 'order_123', description: 'Product purchase' }}
 * />
 */
export default function RazorpayCheckout({
  amount,
  currency = 'INR',
  onSuccess,
  onError,
  customerDetails,
  orderDetails,
}: RazorpayCheckoutProps) {
  const { config, loading, error, isAvailable } = useRazorpay();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!config || !isAvailable) {
      onError('Payment gateway is not available');
      return;
    }

    try {
      setProcessing(true);

      // Create order on server
      const orderData = await createRazorpayOrder(
        amount,
        currency,
        orderDetails?.receipt
      );

      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        // Initialize Razorpay checkout
        const options = {
          key: config.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Your Store Name',
          description: orderDetails?.description || 'Purchase from Your Store',
          order_id: orderData.orderId,
          handler: function (response: any) {
            // Payment successful
            onSuccess(response.razorpay_payment_id, response.razorpay_order_id);
            setProcessing(false);
          },
          prefill: {
            name: customerDetails?.name || '',
            email: customerDetails?.email || '',
            contact: customerDetails?.phone || '',
          },
          theme: {
            color: '#6366f1', // Customize theme color
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
              onError('Payment cancelled by user');
            },
          },
        };

        // @ts-ignore - Razorpay is loaded dynamically
        const rzp = new window.Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        setProcessing(false);
        onError('Failed to load payment gateway');
      };

      document.body.appendChild(script);
    } catch (error) {
      setProcessing(false);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      onError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading payment gateway...</span>
      </div>
    );
  }

  if (error || !isAvailable) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 font-medium">Payment Unavailable</p>
        </div>
        <p className="text-red-600 text-sm mt-1">
          {error || 'Payment gateway is currently disabled'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Amount:</span>
          <span className="text-xl font-bold text-gray-900">
            {currency} {amount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={processing}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay {currency} {amount.toLocaleString()}
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="text-xs text-gray-500 text-center">
        <p>🔒 Payments are processed securely by Razorpay</p>
        <p>Your payment information is encrypted and secure</p>
      </div>
    </div>
  );
}

// Type declaration for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}