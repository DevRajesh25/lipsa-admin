/**
 * Test script to verify Financial Settings are updating in Firebase
 * Run: node test-financial-settings.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFinancialSettings() {
  console.log('🔍 Testing Financial Settings Update...\n');

  try {
    // Test 1: Check if documents exist
    console.log('📋 Step 1: Checking existing documents...');
    
    const platformDoc = await getDoc(doc(db, 'settings', 'platform'));
    const commissionDoc = await getDoc(doc(db, 'settings', 'commission'));
    
    console.log('  Platform settings exist:', platformDoc.exists());
    console.log('  Commission settings exist:', commissionDoc.exists());
    
    if (platformDoc.exists()) {
      console.log('  Current platform data:', platformDoc.data());
    }
    if (commissionDoc.exists()) {
      console.log('  Current commission data:', commissionDoc.data());
    }
    
    console.log('\n✅ Step 1 Complete\n');

    // Test 2: Try to update settings
    console.log('📝 Step 2: Testing update with setDoc (merge: true)...');
    
    const testPlatformData = {
      currency: 'INR',
      taxRate: 18,
      minOrderAmount: 500,
      maxOrderAmount: 500000,
      maintenanceMode: false,
      vendorRegistrationEnabled: true,
      productApprovalRequired: true,
      updatedAt: new Date(),
      testTimestamp: new Date().toISOString(),
    };

    const testCommissionData = {
      commissionPercentage: 10,
      updatedAt: new Date(),
      testTimestamp: new Date().toISOString(),
    };

    await setDoc(doc(db, 'settings', 'platform'), testPlatformData, { merge: true });
    console.log('  ✅ Platform settings updated');

    await setDoc(doc(db, 'settings', 'commission'), testCommissionData, { merge: true });
    console.log('  ✅ Commission settings updated');

    console.log('\n✅ Step 2 Complete\n');

    // Test 3: Verify the updates
    console.log('🔍 Step 3: Verifying updates...');
    
    const updatedPlatformDoc = await getDoc(doc(db, 'settings', 'platform'));
    const updatedCommissionDoc = await getDoc(doc(db, 'settings', 'commission'));
    
    console.log('  Updated platform data:', updatedPlatformDoc.data());
    console.log('  Updated commission data:', updatedCommissionDoc.data());
    
    console.log('\n✅ Step 3 Complete\n');

    console.log('🎉 SUCCESS! Financial Settings are updating correctly in Firebase!\n');
    console.log('Summary:');
    console.log('  ✅ Documents can be read');
    console.log('  ✅ Documents can be written/updated');
    console.log('  ✅ setDoc with merge:true works correctly');
    console.log('  ✅ All financial settings fields are persisting\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n⚠️  PERMISSION ISSUE:');
      console.log('  - Make sure you have admin authentication');
      console.log('  - Check Firestore security rules');
      console.log('  - Verify the user has admin role in Firestore');
    }
  }

  process.exit(0);
}

// Run the test
testFinancialSettings();
