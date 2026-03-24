/**
 * Firebase Initialization Script
 * 
 * This script helps set up initial data in Firebase for testing.
 * Run this from the browser console or create a setup page.
 */

import { collection, addDoc, setDoc, doc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';

// Create admin user
export const createAdminUser = async (
  email: string,
  password: string,
  name: string
) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      name,
      role: 'admin',
      createdAt: Timestamp.now(),
    });
    
    console.log('Admin user created successfully!');
    return userCredential.user.uid;
  } catch (error: any) {
    console.error('Error creating admin user:', error.message);
    throw error;
  }
};

// Create sample categories
export const createSampleCategories = async () => {
  try {
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Fashion', description: 'Clothing and fashion accessories' },
      { name: 'Home & Garden', description: 'Home decor and garden supplies' },
      { name: 'Sports', description: 'Sports equipment and accessories' },
      { name: 'Books', description: 'Books and educational materials' },
    ];
    
    const categoryIds = [];
    
    for (const category of categories) {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...category,
        image: '',
        createdAt: Timestamp.now(),
      });
      categoryIds.push(docRef.id);
      console.log(`Created category: ${category.name}`);
    }
    
    return categoryIds;
  } catch (error: any) {
    console.error('Error creating categories:', error.message);
    throw error;
  }
};

// Create sample vendor
export const createSampleVendor = async (
  email: string,
  password: string,
  name: string,
  storeName: string
) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore (for authentication)
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      name,
      storeName,
      role: 'vendor',
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    
    // Also create vendor document in vendors collection (for admin management)
    await setDoc(doc(db, 'vendors', userCredential.user.uid), {
      email,
      name,
      storeName,
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    
    console.log(`Vendor created: ${name}`);
    return userCredential.user.uid;
  } catch (error: any) {
    console.error('Error creating vendor:', error.message);
    throw error;
  }
};

// Create sample customer
export const createSampleCustomer = async (
  email: string,
  password: string,
  name: string
) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create customer document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      name,
      role: 'customer',
      isBlocked: false,
      createdAt: Timestamp.now(),
    });
    
    console.log(`Customer created: ${name}`);
    return userCredential.user.uid;
  } catch (error: any) {
    console.error('Error creating customer:', error.message);
    throw error;
  }
};

// Create sample product
export const createSampleProduct = async (
  vendorId: string,
  categoryId: string,
  productData: {
    name: string;
    price: number;
    stock: number;
    description?: string;
  }
) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      vendorId,
      categoryId,
      images: [],
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    
    console.log(`Product created: ${productData.name}`);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating product:', error.message);
    throw error;
  }
};

// Create sample order
export const createSampleOrder = async (
  customerId: string,
  vendorId: string,
  totalAmount: number
) => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      customerId,
      vendorId,
      vendors: [vendorId],
      products: [],
      totalAmount,
      paymentStatus: 'paid',
      orderStatus: 'pending',
      createdAt: Timestamp.now(),
    });
    
    console.log(`Order created: ${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating order:', error.message);
    throw error;
  }
};

// Initialize complete demo data
export const initializeCompleteDemo = async () => {
  try {
    console.log('Starting Firebase initialization...');
    
    // 1. Create admin user
    console.log('\n1. Creating admin user...');
    await createAdminUser('admin@marketplace.com', 'Admin@123', 'Admin User');
    
    // 2. Create categories
    console.log('\n2. Creating categories...');
    const categoryIds = await createSampleCategories();
    
    // 3. Create vendors
    console.log('\n3. Creating vendors...');
    const vendor1Id = await createSampleVendor(
      'vendor1@marketplace.com',
      'Vendor@123',
      'John Doe',
      'Tech Store'
    );
    
    const vendor2Id = await createSampleVendor(
      'vendor2@marketplace.com',
      'Vendor@123',
      'Jane Smith',
      'Fashion Hub'
    );
    
    // 4. Create customers
    console.log('\n4. Creating customers...');
    const customer1Id = await createSampleCustomer(
      'customer1@marketplace.com',
      'Customer@123',
      'Alice Johnson'
    );
    
    // 5. Create products
    console.log('\n5. Creating products...');
    await createSampleProduct(vendor1Id, categoryIds[0], {
      name: 'Wireless Headphones',
      price: 99.99,
      stock: 50,
      description: 'High-quality wireless headphones',
    });
    
    await createSampleProduct(vendor2Id, categoryIds[1], {
      name: 'Summer Dress',
      price: 49.99,
      stock: 30,
      description: 'Beautiful summer dress',
    });
    
    // 6. Create orders
    console.log('\n6. Creating orders...');
    await createSampleOrder(customer1Id, vendor1Id, 99.99);
    
    console.log('\n✅ Firebase initialization completed successfully!');
    console.log('\nYou can now login with:');
    console.log('Email: admin@marketplace.com');
    console.log('Password: Admin@123');
    
  } catch (error: any) {
    console.error('\n❌ Initialization failed:', error.message);
    throw error;
  }
};

// Export individual functions for custom setup
export default {
  createAdminUser,
  createSampleCategories,
  createSampleVendor,
  createSampleCustomer,
  createSampleProduct,
  createSampleOrder,
  initializeCompleteDemo,
};
