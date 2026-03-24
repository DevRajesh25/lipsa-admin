/**
 * Debug script to check admin user status
 * Run: node debug-admin.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBjaSfVpgSpOG5ZnaRUawafzpH6mxHzQhU",
  authDomain: "lipsa-aec23.firebaseapp.com",
  projectId: "lipsa-aec23",
  storageBucket: "lipsa-aec23.firebasestorage.app",
  messagingSenderId: "15009459385",
  appId: "1:15009459385:web:76fea985b4d0ae26e6bf68",
};

async function debugAdmin() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('\n📋 Checking all users in the database...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database!');
      console.log('\n💡 You need to create an admin user first.');
      console.log('1. Go to Firebase Console > Authentication');
      console.log('2. Create a new user or note down your existing user UID');
      console.log('3. Update scripts/createAdminUser.ts with your UID and email');
      console.log('4. Run: npx ts-node scripts/createAdminUser.ts');
      return;
    }

    console.log(`\n👥 Found ${usersSnapshot.size} user(s):`);
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\nUser ID: ${doc.id}`);
      console.log(`Email: ${data.email}`);
      console.log(`Name: ${data.name}`);
      console.log(`Role: ${data.role}`);
      console.log(`Is Admin: ${data.role === 'admin' ? '✅ YES' : '❌ NO'}`);
      console.log(`Blocked: ${data.isBlocked ? '🚫 YES' : '✅ NO'}`);
    });

    // Check for admin users specifically
    console.log('\n🔍 Checking for admin users...');
    const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
    const adminSnapshot = await getDocs(adminQuery);
    
    if (adminSnapshot.empty) {
      console.log('❌ No admin users found!');
      console.log('\n💡 To fix this:');
      console.log('1. Update scripts/createAdminUser.ts with your Firebase Auth UID');
      console.log('2. Run: npx ts-node scripts/createAdminUser.ts');
    } else {
      console.log(`✅ Found ${adminSnapshot.size} admin user(s):`);
      adminSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`- ${data.email} (${doc.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugAdmin();