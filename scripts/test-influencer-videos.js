// Test script to create sample influencer videos data with vendor information
// Run this in browser console or as a Node.js script

const sampleVendors = [
  {
    id: "vendor_123",
    name: "John Smith",
    storeName: "TechGear Store",
    email: "john@techgear.com",
    phone: "+1-555-0123",
    status: "approved",
    createdAt: new Date(Date.now() - 30 * 86400000) // 30 days ago
  },
  {
    id: "vendor_456", 
    name: "Sarah Johnson",
    storeName: "WearableTech Co",
    email: "sarah@wearabletech.com",
    phone: "+1-555-0456",
    status: "approved",
    createdAt: new Date(Date.now() - 45 * 86400000) // 45 days ago
  },
  {
    id: "vendor_789",
    name: "Mike Chen",
    storeName: "AudioMax",
    email: "mike@audiomax.com",
    phone: "+1-555-0789",
    status: "suspended",
    createdAt: new Date(Date.now() - 60 * 86400000) // 60 days ago
  }
];

const sampleVideos = [
  {
    videoUrl: "https://example.com/video1.mp4",
    productId: "prod_123",
    productName: "Wireless Headphones",
    vendorId: "vendor_123",
    vendorName: "TechGear Store", // Fallback if vendor lookup fails
    status: "pending",
    uploadDate: new Date(),
    createdAt: new Date()
  },
  {
    videoUrl: "https://example.com/video2.mp4",
    productId: "prod_456",
    productName: "Smart Watch",
    vendorId: "vendor_456",
    vendorName: "WearableTech Co",
    status: "approved",
    uploadDate: new Date(Date.now() - 86400000), // 1 day ago
    createdAt: new Date(Date.now() - 86400000)
  },
  {
    videoUrl: "https://example.com/video3.mp4",
    productId: "prod_789",
    productName: "Bluetooth Speaker",
    vendorId: "vendor_789",
    vendorName: "AudioMax",
    status: "rejected",
    uploadDate: new Date(Date.now() - 172800000), // 2 days ago
    createdAt: new Date(Date.now() - 172800000)
  }
];

const sampleProducts = [
  {
    vendorId: "vendor_123",
    name: "Wireless Headphones Pro",
    price: 15999, // ₹15,999
    status: "approved",
    createdAt: new Date(Date.now() - 7 * 86400000)
  },
  {
    vendorId: "vendor_123", 
    name: "Gaming Mouse",
    price: 6499, // ₹6,499
    status: "approved",
    createdAt: new Date(Date.now() - 14 * 86400000)
  },
  {
    vendorId: "vendor_456",
    name: "Smart Watch Series X",
    price: 24999, // ₹24,999
    status: "approved", 
    createdAt: new Date(Date.now() - 3 * 86400000)
  }
];

const sampleOrders = [
  {
    vendorId: "vendor_123",
    customerId: "customer_1",
    totalAmount: 15999, // ₹15,999
    status: "delivered",
    createdAt: new Date(Date.now() - 5 * 86400000)
  },
  {
    vendorId: "vendor_456",
    customerId: "customer_2", 
    totalAmount: 24999, // ₹24,999
    status: "shipped",
    createdAt: new Date(Date.now() - 2 * 86400000)
  }
];

// To add sample data to Firestore (run in browser console):
/*
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

// Add vendors first
sampleVendors.forEach(async (vendor) => {
  try {
    await setDoc(doc(db, 'vendors', vendor.id), vendor);
    console.log('Added vendor:', vendor.name);
  } catch (error) {
    console.error('Error adding vendor:', error);
  }
});

// Add products
sampleProducts.forEach(async (product) => {
  try {
    await addDoc(collection(db, 'products'), product);
    console.log('Added product:', product.name);
  } catch (error) {
    console.error('Error adding product:', error);
  }
});

// Add orders
sampleOrders.forEach(async (order) => {
  try {
    await addDoc(collection(db, 'orders'), order);
    console.log('Added order for vendor:', order.vendorId);
  } catch (error) {
    console.error('Error adding order:', error);
  }
});

// Add influencer videos
sampleVideos.forEach(async (video) => {
  try {
    await addDoc(collection(db, 'influencerVideos'), video);
    console.log('Added video:', video.productName);
  } catch (error) {
    console.error('Error adding video:', error);
  }
});
*/

console.log('Sample data ready:', {
  vendors: sampleVendors,
  videos: sampleVideos,
  products: sampleProducts,
  orders: sampleOrders
});