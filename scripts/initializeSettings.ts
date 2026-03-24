import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Default settings values
const defaultPlatformSettings = {
  currency: 'INR',
  taxRate: 18,
  minOrderAmount: 500,
  maxOrderAmount: 500000,
  maintenanceMode: false,
  vendorRegistrationEnabled: true,
  productApprovalRequired: true,
};

const defaultCommissionSettings = {
  commissionPercentage: 10,
};

const defaultNotificationSettings = {
  emailNotifications: true,
  orderNotifications: true,
  payoutNotifications: true,
};

const defaultRazorpaySettings = {
  keyId: '',
  keySecret: '',
  isActive: false,
  updatedAt: new Date(),
};

async function initializeSettings() {
  try {
    console.log('Initializing settings documents...');

    // Initialize platform settings
    const platformDoc = await getDoc(doc(db, 'settings', 'platform'));
    if (!platformDoc.exists()) {
      await setDoc(doc(db, 'settings', 'platform'), defaultPlatformSettings);
      console.log('✅ Platform settings initialized');
    } else {
      console.log('ℹ️ Platform settings already exist');
    }

    // Initialize commission settings
    const commissionDoc = await getDoc(doc(db, 'settings', 'commission'));
    if (!commissionDoc.exists()) {
      await setDoc(doc(db, 'settings', 'commission'), defaultCommissionSettings);
      console.log('✅ Commission settings initialized');
    } else {
      console.log('ℹ️ Commission settings already exist');
    }

    // Initialize notification settings
    const notificationDoc = await getDoc(doc(db, 'settings', 'notifications'));
    if (!notificationDoc.exists()) {
      await setDoc(doc(db, 'settings', 'notifications'), defaultNotificationSettings);
      console.log('✅ Notification settings initialized');
    } else {
      console.log('ℹ️ Notification settings already exist');
    }

    // Initialize Razorpay settings
    const razorpayDoc = await getDoc(doc(db, 'settings', 'razorpay'));
    if (!razorpayDoc.exists()) {
      await setDoc(doc(db, 'settings', 'razorpay'), defaultRazorpaySettings);
      console.log('✅ Razorpay settings initialized');
    } else {
      console.log('ℹ️ Razorpay settings already exist');
    }

    console.log('🎉 Settings initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing settings:', error);
  }
}

// Run the initialization
initializeSettings();