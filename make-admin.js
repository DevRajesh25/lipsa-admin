/**
 * Quick script to make a user admin
 * Run: node make-admin.js YOUR_USER_UID
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBjaSfVpgSpOG5ZnaRUawafzpH6mxHzQhU",
  authDomain: "lipsa-aec23.firebaseapp.com",
  projectId: "lipsa-aec23",
  storageBucket: "lipsa-aec23.firebasestorage.app",
  messagingSenderId: "15009459385",
  appId: "1:15009459385:web:76fea985b4d0ae26e6bf68",
};

async function makeAdmin() {
  const userUid = process.argv[2];
  
  if (!userUid) {
    console.log('❌ Please provide a user UID');
    console.log('Usage: node make-admin.js YOUR_USER_UID');
    console.log('\nTo find your UID:');
    console.log('1. Go to Firebase Console > Authentication');
    console.log('2. Find your user and copy the UID');
    console.log('3. Or run: node debug-admin.js to see all users');
    return;
  }

  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log(`\n👤 Checking user: ${userUid}`);
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', userUid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log(`Found existing user: ${userData.email}`);
      console.log(`Current role: ${userData.role}`);
      
      // Update to admin
      await setDoc(doc(db, 'users', userUid), {
        ...userData,
        role: 'admin',
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      console.log('✅ User updated to admin successfully!');
    } else {
      console.log('❌ User document not found. Creating new admin user...');
      console.log('⚠️  Please provide email and name:');
      
      // Create new admin user document
      await setDoc(doc(db, 'users', userUid), {
        name: 'Admin User', // You can change this
        email: 'admin@example.com', // You can change this
        role: 'admin',
        isBlocked: false,
        createdAt: serverTimestamp(),
      });
      
      console.log('✅ New admin user created successfully!');
      console.log('⚠️  Please update the email and name in Firebase Console if needed');
    }

    console.log('\n🎉 You can now use admin features!');
    console.log('Try refreshing your browser and logging in again.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

makeAdmin();