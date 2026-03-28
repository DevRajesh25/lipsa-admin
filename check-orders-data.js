require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Missing Firebase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = admin.firestore();

async function checkOrdersData() {
  try {
    console.log('🔍 Checking orders data...\n');
    
    const ordersSnapshot = await db.collection('orders').get();
    
    console.log(`📊 Total orders in database: ${ordersSnapshot.size}\n`);
    
    if (ordersSnapshot.empty) {
      console.log('❌ No orders found in database');
      return;
    }
    
    let totalRevenue = 0;
    let paidOrders = 0;
    let pendingOrders = 0;
    let failedOrders = 0;
    
    console.log('📋 Order Details:\n');
    console.log('─'.repeat(100));
    
    ordersSnapshot.forEach((doc) => {
      const order = doc.data();
      const orderId = doc.id.substring(0, 8);
      const paymentStatus = order.paymentStatus || 'unknown';
      const orderStatus = order.orderStatus || 'unknown';
      const totalAmount = order.totalAmount || 0;
      
      console.log(`Order ID: ${orderId}...`);
      console.log(`  Payment Status: ${paymentStatus}`);
      console.log(`  Order Status: ${orderStatus}`);
      console.log(`  Total Amount: ₹${totalAmount.toLocaleString('en-IN')}`);
      console.log(`  Customer ID: ${order.customerId || 'N/A'}`);
      console.log(`  Created: ${order.createdAt?.toDate?.() || 'N/A'}`);
      console.log('─'.repeat(100));
      
      if (paymentStatus === 'paid') {
        paidOrders++;
        totalRevenue += totalAmount;
      } else if (paymentStatus === 'pending') {
        pendingOrders++;
      } else if (paymentStatus === 'failed') {
        failedOrders++;
      }
    });
    
    console.log('\n📈 Summary:');
    console.log(`Total Orders: ${ordersSnapshot.size}`);
    console.log(`Paid Orders: ${paidOrders}`);
    console.log(`Pending Orders: ${pendingOrders}`);
    console.log(`Failed Orders: ${failedOrders}`);
    console.log(`\n💰 Total Revenue (from paid orders): ₹${totalRevenue.toLocaleString('en-IN')}`);
    
    if (paidOrders === 0) {
      console.log('\n⚠️  WARNING: No orders with paymentStatus="paid" found!');
      console.log('This is why the dashboard shows ₹0 revenue.');
      console.log('\nTo fix this, you need to:');
      console.log('1. Update existing orders to have paymentStatus="paid"');
      console.log('2. Or ensure new orders are created with proper payment status');
    }
    
  } catch (error) {
    console.error('❌ Error checking orders:', error);
  }
}

checkOrdersData()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
