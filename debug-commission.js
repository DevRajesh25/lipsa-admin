// Debug script to check Platform Commission calculation
// Run with: node debug-commission.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, doc, getDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugCommission() {
  console.log('🔍 Debugging Platform Commission Calculation...\n');

  try {
    // 1. Check commission settings
    console.log('1️⃣ Checking Commission Settings:');
    const commissionDoc = await getDoc(doc(db, 'settings', 'commission'));
    if (commissionDoc.exists()) {
      const commissionData = commissionDoc.data();
      console.log(`   ✅ Commission Percentage: ${commissionData.commissionPercentage}%`);
    } else {
      console.log('   ❌ Commission settings document does NOT exist!');
      console.log('   💡 Run: npm run init-settings');
      return;
    }

    // 2. Check total orders
    console.log('\n2️⃣ Checking Orders:');
    const allOrdersSnap = await getDocs(collection(db, 'orders'));
    console.log(`   📦 Total Orders: ${allOrdersSnap.size}`);

    // 3. Check paid orders
    console.log('\n3️⃣ Checking Paid Orders:');
    const paidOrdersSnap = await getDocs(
      query(collection(db, 'orders'), where('paymentStatus', '==', 'paid'))
    );
    console.log(`   💰 Paid Orders: ${paidOrdersSnap.size}`);

    // 4. Calculate revenue from paid orders
    let totalRevenue = 0;
    const orderDetails = [];
    
    paidOrdersSnap.forEach((doc) => {
      const order = doc.data();
      const amount = order.totalAmount || 0;
      totalRevenue += amount;
      orderDetails.push({
        id: doc.id.slice(0, 8) + '...',
        amount: amount,
        status: order.paymentStatus,
        orderStatus: order.orderStatus
      });
    });

    console.log(`   💵 Total Revenue from Paid Orders: ₹${totalRevenue.toLocaleString('en-IN')}`);

    if (orderDetails.length > 0) {
      console.log('\n   📋 Paid Order Details:');
      orderDetails.forEach((order, index) => {
        console.log(`      ${index + 1}. Order ${order.id}: ₹${order.amount.toLocaleString('en-IN')} (${order.orderStatus})`);
      });
    }

    // 5. Calculate platform commission
    const commissionPercentage = commissionDoc.data().commissionPercentage || 0;
    const platformCommission = (totalRevenue * commissionPercentage) / 100;

    console.log('\n4️⃣ Platform Commission Calculation:');
    console.log(`   Formula: (Total Revenue × Commission %) / 100`);
    console.log(`   Calculation: (₹${totalRevenue.toLocaleString('en-IN')} × ${commissionPercentage}%) / 100`);
    console.log(`   Result: ₹${platformCommission.toLocaleString('en-IN')}`);

    // 6. Diagnosis
    console.log('\n5️⃣ Diagnosis:');
    if (platformCommission === 0) {
      if (paidOrdersSnap.size === 0) {
        console.log('   ⚠️  ISSUE: No paid orders found in the database');
        console.log('   💡 SOLUTION: Orders need to have paymentStatus = "paid" to count towards commission');
        
        // Check if there are orders with other payment statuses
        const pendingPaymentSnap = await getDocs(
          query(collection(db, 'orders'), where('paymentStatus', '==', 'pending'))
        );
        const failedPaymentSnap = await getDocs(
          query(collection(db, 'orders'), where('paymentStatus', '==', 'failed'))
        );
        
        if (pendingPaymentSnap.size > 0) {
          console.log(`   📊 Found ${pendingPaymentSnap.size} orders with "pending" payment status`);
        }
        if (failedPaymentSnap.size > 0) {
          console.log(`   📊 Found ${failedPaymentSnap.size} orders with "failed" payment status`);
        }
      } else if (totalRevenue === 0) {
        console.log('   ⚠️  ISSUE: Paid orders exist but totalAmount is 0');
        console.log('   💡 SOLUTION: Check that orders have a valid totalAmount field');
      } else if (commissionPercentage === 0) {
        console.log('   ⚠️  ISSUE: Commission percentage is set to 0%');
        console.log('   💡 SOLUTION: Update commission percentage in Settings page');
      }
    } else {
      console.log('   ✅ Platform Commission is calculating correctly!');
      console.log(`   💰 Expected Dashboard Display: ₹${platformCommission.toLocaleString('en-IN')}`);
    }

    // 7. Check all orders payment status distribution
    console.log('\n6️⃣ Payment Status Distribution:');
    const statusCount = {};
    allOrdersSnap.forEach((doc) => {
      const status = doc.data().paymentStatus || 'undefined';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} orders`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n✅ Debug complete!\n');
  process.exit(0);
}

debugCommission();
