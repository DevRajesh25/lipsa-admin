/**
 * Test script to check payout requests in Firestore
 * Run with: node test-payouts.js
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function testPayouts() {
  try {
    console.log('🔍 Checking payout requests...\n');

    // Get all payout requests
    const payoutsSnapshot = await db.collection('payoutRequests').get();
    
    if (payoutsSnapshot.empty) {
      console.log('❌ No payout requests found in database');
      console.log('\n💡 Tip: Payout requests are created by vendors, not admins');
      return;
    }

    console.log(`📦 Found ${payoutsSnapshot.size} payout request(s)\n`);

    // Check each payout
    for (const payoutDoc of payoutsSnapshot.docs) {
      const data = payoutDoc.data();
      console.log(`\n📄 Payout ID: ${payoutDoc.id}`);
      console.log(`   Vendor ID: ${data.vendorId || '❌ MISSING'}`);
      console.log(`   Amount: ₹${data.amount || 0}`);
      console.log(`   Status: ${data.status || 'pending'}`);
      console.log(`   Request Date: ${data.requestDate?.toDate() || 'N/A'}`);

      // Check if vendor exists
      if (data.vendorId) {
        try {
          const vendorDoc = await db.collection('vendors').doc(data.vendorId).get();
          if (vendorDoc.exists()) {
            const vendorData = vendorDoc.data();
            console.log(`   ✅ Vendor Found: ${vendorData.name || 'Unknown'}`);
            console.log(`      Email: ${vendorData.email || 'N/A'}`);
            console.log(`      Status: ${vendorData.status || 'N/A'}`);
            
            if (vendorData.bankDetails) {
              console.log(`      ✅ Bank Details: Available`);
              console.log(`         Account: ${vendorData.bankDetails.accountNumber || 'N/A'}`);
              console.log(`         Bank: ${vendorData.bankDetails.bankName || 'N/A'}`);
            } else {
              console.log(`      ⚠️  Bank Details: Not provided`);
            }
          } else {
            console.log(`   ❌ Vendor NOT FOUND in vendors collection`);
          }
        } catch (error) {
          console.log(`   ❌ Error fetching vendor: ${error.message}`);
        }
      } else {
        console.log(`   ❌ No vendorId in payout request`);
      }
    }

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testPayouts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
