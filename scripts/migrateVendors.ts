/**
 * Vendor Migration Script
 * 
 * This script migrates vendor data from users collection to vendors collection
 * to maintain consistency across the application.
 */

import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const migrateVendorsToVendorsCollection = async () => {
  try {
    console.log('Starting vendor migration...');
    
    // Get all users with vendor role
    const vendorsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'vendor')
    );
    
    const vendorsSnapshot = await getDocs(vendorsQuery);
    
    if (vendorsSnapshot.empty) {
      console.log('No vendors found in users collection');
      return;
    }
    
    console.log(`Found ${vendorsSnapshot.size} vendors to migrate`);
    
    // Migrate each vendor
    for (const vendorDoc of vendorsSnapshot.docs) {
      const vendorData = vendorDoc.data();
      
      // Create vendor document in vendors collection
      await setDoc(doc(db, 'vendors', vendorDoc.id), {
        email: vendorData.email,
        name: vendorData.name,
        storeName: vendorData.storeName || vendorData.name,
        status: vendorData.status || 'pending',
        createdAt: vendorData.createdAt,
        // Copy any other relevant fields
        phone: vendorData.phone,
        address: vendorData.address,
        description: vendorData.description,
      });
      
      console.log(`Migrated vendor: ${vendorData.name} (${vendorData.email})`);
    }
    
    console.log('✅ Vendor migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (typeof window !== 'undefined') {
  // Browser environment - can be called from console
  (window as any).migrateVendors = migrateVendorsToVendorsCollection;
  console.log('Migration function available as: migrateVendors()');
}