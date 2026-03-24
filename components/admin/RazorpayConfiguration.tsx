'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Eye, EyeOff, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { RazorpayService } from '@/lib/services/razorpayService';
import type { RazorpaySettings } from '@/types';

interface RazorpayConfigurationProps {
  onSave: (settings: Omit<RazorpaySettings, 'updatedAt'>) => Promise<void>;
  loading?: boolean;
  saving?: boolean;
}

export default function RazorpayConfiguration({ onSave, loading, saving }: RazorpayConfigurationProps) {
  const [settings, setSettings] = useState<Omit<RazorpaySettings, 'updatedAt'>>({
    keyId: '',
    keySecret: '',
    isActive: false,
  });
  
  const [showSecret, setShowSecret] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasExistingData, setHasExistingData] = useState(false);

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const existingSettings = await RazorpayService.getRazorpaySettings();
        if (existingSettings) {
          setSettings({
            keyId: existingSettings.keyId,
            keySecret: existingSettings.keySecret,
            isActive: existingSettings.isActive,
          });
          setHasExistingData(true);
        }
      } catch (error) {
        console.error('Error loading Razorpay settings:', error);
      }
    };

    if (!loading) {
      loadSettings();
    }
  }, [loading]);

  const handleSave = async () => {
    // Validate credentials
    const validation = RazorpayService.validateCredentials(settings.keyId, settings.keySecret);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    
    try {
      await onSave(settings);
      setHasExistingData(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      setErrors([errorMessage]);
    }
  };

  const handleInputChange = (field: keyof typeof settings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const displayKeySecret = hasExistingData && !showSecret 
    ? RazorpayService.maskKeySecret(settings.keySecret)
    : settings.keySecret;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg">
          <CreditCard className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Razorpay Configuration</h3>
          <p className="text-sm text-gray-600">Manage payment gateway credentials</p>
        </div>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Payment Status Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Enable Payments</p>
              <p className="text-sm text-gray-600">Allow customers to make payments via Razorpay</p>
            </div>
          </div>
          <button
            onClick={() => handleInputChange('isActive', !settings.isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.isActive ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Razorpay Key ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Razorpay Key ID
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={settings.keyId}
            onChange={(e) => handleInputChange('keyId', e.target.value)}
            placeholder="rzp_test_xxxxxxxxxx or rzp_live_xxxxxxxxxx"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Find this in your Razorpay Dashboard → Settings → API Keys
          </p>
        </div>

        {/* Razorpay Key Secret */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Razorpay Key Secret
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={displayKeySecret}
              onChange={(e) => {
                // Only allow editing if showing secret or no existing data
                if (showSecret || !hasExistingData) {
                  handleInputChange('keySecret', e.target.value);
                }
              }}
              placeholder="Enter your Razorpay Key Secret"
              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              readOnly={hasExistingData && !showSecret}
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showSecret ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Keep this secret secure. Never share it publicly.
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">Security Notice</p>
              <p className="text-yellow-700">
                Your Key Secret is encrypted and stored securely. It's only used server-side for payment processing 
                and never exposed to the frontend.
              </p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {hasExistingData && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Razorpay credentials configured successfully
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving || !settings.keyId.trim() || !settings.keySecret.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : (
              'Save Razorpay Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}