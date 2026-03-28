/**
 * Script to update existing orders with payment breakdown
 * Calculates productPrice, taxAmount, commissionAmount, and vendorAmount
 * based on totalAmount and current settings
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount as any),
  });
}

const db = getFirestore();

interface OrderCalculation {
  productPrice: number;
  taxAmount: number;
  totalAmount: number;
  commissionAmount: number;
  vendorAmount: number;
}

/**
 * Calculate order breakdown from total amount (reverse calculation)
 */
function calculateFromTotal(
  totalAmount: number,
  taxRate: number,
  commissionPercentage: number
): OrderCalculation {
  // Product price = Total / (1 + taxRate/100)
  const productPrice = Math.round(totalAmount / (1 + taxRate / 100));
  
  // Calculate tax on product price
  const taxAmount = Math.round((productPrice * taxRate) / 100);
  
  // Commission is calculated on product price (not including tax)
  const commissionAmount = Math.round((productPrice * commissionPercentage) / 100);
  
  // Vendor receives product price minus commission
  const vendorEarnings = productPrice - commissionAmount;
  
  return {
    productPrice,
    taxAmount,
    totalAmount,
    commissionAmount,
    vendorEarnings,
  };
}

async function updateOrderBreakdown() {
  try {
    console.log('🔄 Starting order breakdown update...\n');

    // Get settings
    const platformDoc = await db.collection('settings').doc('platform').get();
    const commissionDoc = await db.collection('settings').doc('commission').get();

    const taxRate = platformDoc.exists ? platformDoc.data()?.taxRate || 18 : 18;
    const commissionPercentage = commissionDoc.exists ? commissionDoc.data()?.commissionPercentage || 10 : 10;

    console.log(`📊 Using settings:`);
    console.log(`   Tax Rate: ${taxRate}%`);
    console.log(`   Commission: ${commissionPercentage}%\n`);

    // Get all orders
    const ordersSnapshot = await db.collection('orders').get();
    
    if (ordersSnapshot.empty) {
      console.log('❌ No orders found in database');
      return;
    }

    console.log(`📦 Found ${ordersSnapshot.size} orders to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Process each order
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data();
      const orderId = orderDoc.id;

      // Skip if already has breakdown
      if (orderData.productPrice && orderData.taxAmount && orderData.commissionAmount && orderData.vendorAmount) {
        console.log(`⏭️  Order ${orderId.slice(0, 8)}... already has breakdown, skipping`);
        skippedCount++;
        continue;
      }

      const totalAmount = orderData.totalAmount || 0;

      if (totalAmount === 0) {
        console.log(`⚠️  Order ${orderId.slice(0, 8)}... has zero total amount, skipping`);
        skippedCount++;
        continue;
      }

      // Calculate breakdown
      const breakdown = calculateFromTotal(totalAmount, taxRate, commissionPercentage);

      // Update order
      await db.collection('orders').doc(orderId).update({
        productPrice: breakdown.productPrice,
        taxAmount: breakdown.taxAmount,
        commissionAmount: breakdown.commissionAmount,
        vendorEarnings: breakdown.vendorEarnings,
        updatedAt: new Date(),
      });

      console.log(`✅ Order ${orderId.slice(0, 8)}...`);
      console.log(`   Total: ₹${totalAmount.toLocaleString('en-IN')}`);
      console.log(`   Product: ₹${breakdown.productPrice.toLocaleString('en-IN')}`);
      console.log(`   Tax: ₹${breakdown.taxAmount.toLocaleString('en-IN')}`);
      console.log(`   Commission: ₹${breakdown.commissionAmount.toLocaleString('en-IN')}`);
      console.log(`   Vendor Earnings: ₹${breakdown.vendorEarnings.toLocaleString('en-IN')}\n`);

      updatedCount++;
    }

    console.log('\n✨ Update complete!');
    console.log(`   Updated: ${updatedCount} orders`);
    console.log(`   Skipped: ${skippedCount} orders`);

  } catch (error) {
    console.error('❌ Error updating orders:', error);
    throw error;
  }
}

// Run the script
updateOrderBreakdown()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
