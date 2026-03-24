'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TopBar from '@/components/admin/TopBar';
import Toast from '@/components/admin/Toast';
import { useToast } from '@/hooks/useToast';
import { DollarSign, Bell, Shield, Database } from 'lucide-react';
import type { PlatformSettings, CommissionSettings, NotificationSettings, RazorpaySettings } from '@/types';
import RazorpayConfiguration from '@/components/admin/RazorpayConfiguration';
import { RazorpayService } from '@/lib/services/razorpayService';

export default function SettingsPage() {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRazorpay, setSavingRazorpay] = useState(false);
  
  // Platform Settings State
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    currency: 'INR',
    taxRate: 18,
    minOrderAmount: 500,
    maxOrderAmount: 500000,
    maintenanceMode: false,
    vendorRegistrationEnabled: true,
    productApprovalRequired: true,
  });

  // Commission Settings State
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings>({
    commissionPercentage: 10,
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    orderNotifications: true,
    payoutNotifications: true,
  });

  // Load settings from Firestore on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        // Load platform settings
        const platformDoc = await getDoc(doc(db, 'settings', 'platform'));
        if (platformDoc.exists()) {
          setPlatformSettings(platformDoc.data() as PlatformSettings);
        }

        // Load commission settings
        const commissionDoc = await getDoc(doc(db, 'settings', 'commission'));
        if (commissionDoc.exists()) {
          setCommissionSettings(commissionDoc.data() as CommissionSettings);
        }
        // Load notification settings
        const notificationDoc = await getDoc(doc(db, 'settings', 'notifications'));
        if (notificationDoc.exists()) {
          setNotificationSettings(notificationDoc.data() as NotificationSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [showToast]);

  // Save all settings to Firestore
  const handleSave = async () => {
    try {
      setSaving(true);

      // Update platform settings
      await updateDoc(doc(db, 'settings', 'platform'), {
        currency: platformSettings.currency,
        taxRate: platformSettings.taxRate,
        minOrderAmount: platformSettings.minOrderAmount,
        maxOrderAmount: platformSettings.maxOrderAmount,
        maintenanceMode: platformSettings.maintenanceMode,
        vendorRegistrationEnabled: platformSettings.vendorRegistrationEnabled,
        productApprovalRequired: platformSettings.productApprovalRequired,
      });

      // Update commission settings
      await updateDoc(doc(db, 'settings', 'commission'), {
        commissionPercentage: commissionSettings.commissionPercentage,
      });

      // Update notification settings
      await updateDoc(doc(db, 'settings', 'notifications'), {
        emailNotifications: notificationSettings.emailNotifications,
        orderNotifications: notificationSettings.orderNotifications,
        payoutNotifications: notificationSettings.payoutNotifications,
      });

      showToast('Settings updated successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save Razorpay settings separately
  const handleRazorpaySave = async (razorpaySettings: Omit<RazorpaySettings, 'updatedAt'>) => {
    try {
      setSavingRazorpay(true);
      await RazorpayService.updateRazorpaySettings(razorpaySettings);
      showToast('Razorpay settings updated successfully', 'success');
    } catch (error) {
      console.error('Error saving Razorpay settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save Razorpay settings';
      showToast(errorMessage, 'error');
      throw error; // Re-throw to let the component handle it
    } finally {
      setSavingRazorpay(false);
    }
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Platform Settings" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }
  return (
    <>
      <div>
        <TopBar title="Platform Settings" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Razorpay Configuration */}
          <div className="lg:col-span-2">
            <RazorpayConfiguration 
              onSave={handleRazorpaySave}
              loading={loading}
              saving={savingRazorpay}
            />
          </div>

          {/* Financial Settings */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Financial Settings</h3>
                <p className="text-sm text-gray-600">Configure commission and pricing</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Commission (%)
                </label>
                <input
                  type="number"
                  value={commissionSettings.commissionPercentage}
                  onChange={(e) => setCommissionSettings({ 
                    ...commissionSettings, 
                    commissionPercentage: Number(e.target.value) 
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={platformSettings.taxRate}
                  onChange={(e) => setPlatformSettings({ 
                    ...platformSettings, 
                    taxRate: Number(e.target.value) 
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={platformSettings.currency}
                  onChange={(e) => setPlatformSettings({ 
                    ...platformSettings, 
                    currency: e.target.value 
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount
                </label>
                <input
                  type="number"
                  value={platformSettings.minOrderAmount}
                  onChange={(e) => setPlatformSettings({ 
                    ...platformSettings, 
                    minOrderAmount: Number(e.target.value) 
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Order Amount
                </label>
                <input
                  type="number"
                  value={platformSettings.maxOrderAmount}
                  onChange={(e) => setPlatformSettings({ 
                    ...platformSettings, 
                    maxOrderAmount: Number(e.target.value) 
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          {/* Notification Settings */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Notification Settings</h3>
                <p className="text-sm text-gray-600">Manage email notifications</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive general email updates</p>
                </div>
                <button
                  onClick={() => setNotificationSettings({ 
                    ...notificationSettings, 
                    emailNotifications: !notificationSettings.emailNotifications 
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.emailNotifications ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Order Notifications</p>
                  <p className="text-sm text-gray-600">Get notified about new orders</p>
                </div>
                <button
                  onClick={() => setNotificationSettings({ 
                    ...notificationSettings, 
                    orderNotifications: !notificationSettings.orderNotifications 
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.orderNotifications ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.orderNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Payout Notifications</p>
                  <p className="text-sm text-gray-600">Alerts for payout requests</p>
                </div>
                <button
                  onClick={() => setNotificationSettings({ 
                    ...notificationSettings, 
                    payoutNotifications: !notificationSettings.payoutNotifications 
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.payoutNotifications ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.payoutNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Platform Controls */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Platform Controls</h3>
                <p className="text-sm text-gray-600">Manage platform features</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Maintenance Mode</p>
                  <p className="text-sm text-gray-600">Disable public access temporarily</p>
                </div>
                <button
                  onClick={() => setPlatformSettings({ 
                    ...platformSettings, 
                    maintenanceMode: !platformSettings.maintenanceMode 
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    platformSettings.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      platformSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Vendor Registration</p>
                  <p className="text-sm text-gray-600">Allow new vendor signups</p>
                </div>
                <button
                  onClick={() => setPlatformSettings({ 
                    ...platformSettings, 
                    vendorRegistrationEnabled: !platformSettings.vendorRegistrationEnabled 
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    platformSettings.vendorRegistrationEnabled ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      platformSettings.vendorRegistrationEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Product Approval</p>
                  <p className="text-sm text-gray-600">Require admin approval for products</p>
                </div>
                <button
                  onClick={() => setPlatformSettings({ 
                    ...platformSettings, 
                    productApprovalRequired: !platformSettings.productApprovalRequired 
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    platformSettings.productApprovalRequired ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      platformSettings.productApprovalRequired ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          {/* System Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Database className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">System Information</h3>
                <p className="text-sm text-gray-600">Platform details and stats</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Platform Version</span>
                <span className="text-sm font-semibold text-gray-900">v2.0.0</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Database Status</span>
                <span className="text-sm font-semibold text-green-600">Connected</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Storage Used</span>
                <span className="text-sm font-semibold text-gray-900">2.4 GB / 10 GB</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Last Backup</span>
                <span className="text-sm font-semibold text-gray-900">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : (
              'Save All Settings'
            )}
          </button>
        </div>
      </div>

      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
}