/**
 * Firebase Initialization Script
 * Run this script to set up initial collections and data in Firebase
 * 
 * Usage: npx ts-node scripts/initFirebase.ts
 */

import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

async function initializeFirebase() {
  console.log('🚀 Initializing Firebase collections...\n');

  try {
    // Create admin user
    console.log('Creating admin user...');
    await setDoc(doc(db, 'users', 'admin-user-id'), {
      name: 'Admin User',
      email: 'admin@lipsa.com',
      role: 'admin',
      isBlocked: false,
      createdAt: Timestamp.now()
    });
    console.log('✅ Admin user created\n');

    // Create sample vendor
    console.log('Creating sample vendor...');
    await setDoc(doc(db, 'users', 'vendor-1'), {
      name: 'Tech Store',
      email: 'vendor@techstore.com',
      role: 'vendor',
      status: 'approved',
      isBlocked: false,
      createdAt: Timestamp.now()
    });
    console.log('✅ Sample vendor created\n');

    // Create sample categories
    console.log('Creating sample categories...');
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and accessories', productCount: 0 },
      { name: 'Fashion', description: 'Clothing and accessories', productCount: 0 },
      { name: 'Home & Living', description: 'Home decor and furniture', productCount: 0 },
      { name: 'Sports', description: 'Sports equipment and accessories', productCount: 0 }
    ];

    for (const category of categories) {
      await setDoc(doc(collection(db, 'categories')), {
        ...category,
        createdAt: Timestamp.now()
      });
    }
    console.log('✅ Sample categories created\n');

    // Create sample product
    console.log('Creating sample product...');
    await setDoc(doc(collection(db, 'products')), {
      name: 'Wireless Headphones',
      vendorId: 'vendor-1',
      vendorName: 'Tech Store',
      categoryId: 'electronics',
      price: 2999,
      stock: 50,
      status: 'approved',
      images: [],
      createdAt: Timestamp.now()
    });
    console.log('✅ Sample product created\n');

    // Create sample order
    console.log('Creating sample order...');
    await setDoc(doc(collection(db, 'orders')), {
      customerId: 'customer-1',
      customerName: 'John Doe',
      vendorId: 'vendor-1',
      vendors: ['vendor-1'],
      products: [
        {
          productId: 'product-1',
          name: 'Wireless Headphones',
          price: 2999,
          quantity: 1
        }
      ],
      totalAmount: 2999,
      paymentStatus: 'paid',
      orderStatus: 'pending',
      createdAt: Timestamp.now()
    });
    console.log('✅ Sample order created\n');

    // Create settings document
    console.log('Creating platform settings...');
    await setDoc(doc(db, 'settings', 'platform'), {
      commissionPercentage: 10,
      updatedAt: Timestamp.now()
    });
    console.log('✅ Platform settings created\n');

    console.log('🎉 Firebase initialization complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Create an admin user in Firebase Authentication');
    console.log('2. Use the same UID in the users collection');
    console.log('3. Set role to "admin" in Firestore');
    console.log('4. Login with admin credentials\n');

  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
  }
}

// Run the initialization
initializeFirebase();
