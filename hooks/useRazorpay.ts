'use client';

import { useState, useEffect } from 'react';

interface RazorpayConfig {
  keyId: string;
  isActive: boolean;
}

interface UseRazorpayReturn {
  config: RazorpayConfig | null;
  loading: boolean;
  error: string | null;
  isAvailable: boolean;
}

/**
 * Custom hook for Razorpay frontend integration
 * Fetches only the public Key ID, never the secret
 */
export function useRazorpay(): UseRazorpayReturn {
  const [config, setConfig] = useState<RazorpayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/razorpay/config');
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Payment gateway is not configured');
          } else {
            setError('Failed to load payment configuration');
          }
          return;
        }

        const data = await response.json();
        setConfig(data);
      } catch (err) {
        console.error('Error fetching Razorpay config:', err);
        setError('Failed to load payment configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return {
    config,
    loading,
    error,
    isAvailable: config?.isActive === true && !!config?.keyId,
  };
}

/**
 * Create a Razorpay order on the server
 */
export async function createRazorpayOrder(amount: number, currency = 'INR', receipt?: string) {
  try {
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}