/**
 * Script to create admin user document in Firestore
 * Run this after creating your Firebase Authentication user
 * 
 * Usage:
 * 1. Update the USER_UID and USER_EMAIL constants below
 * 2. Run: npx ts-node scripts/createAdminUser.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ⚠️ UPDATE THESE VALUES
const USER_UID = '6UEfM5O4WNgUBWKSw38hsdVtaah1'; // Your User UID from Firebase Authentication
const USER_EMAIL = 'your-email@example.com'; // Your login email
const USER_NAME = 'Admin User'; // Your name

async function createAdminUser() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('📝 Creating admin user document...');
    console.log('User UID:', USER_UID);
    console.log('Email:', USER_EMAIL);

    await setDoc(doc(db, 'users', USER_UID), {
      name: USER_NAME,
      email: USER_EMAIL,
      role: 'admin',
      isBlocked: false,
      createdAt: serverTimestamp(),
    });

    console.log('✅ Admin user created successfully!');
    console.log('\nUser document created at:');
    console.log(`users/${USER_UID}`);
    console.log('\nYou can now login with your credentials.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
