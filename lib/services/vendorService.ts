import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getCountFromServer,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Vendor } from '@/types';

// Get all vendors
export const getAllVendors = async (): Promise<Vendor[]> => {
  try {
    const vendorsQuery = query(
      collection(db, 'vendors'), 
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(vendorsQuery);
    
    const vendors = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        // Count vendor's products
        const productsQuery = query(
          collection(db, 'products'), 
          where('vendorId', '==', docSnap.id)
        );
        const productsCount = await getCountFromServer(productsQuery);
        
        // Calculate total revenue (optional)
        const ordersQuery = query(
          collection(db, 'orders'),
          where('vendorId', '==', docSnap.id),
          where('orderStatus', '==', 'delivered')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const totalRevenue = ordersSnapshot.docs.reduce((sum, doc) => {
          return sum + (doc.data().totalAmount || 0);
        }, 0);
        
        return {
          id: docSnap.id,
          name: data.name || 'N/A',
          email: data.email || 'N/A',
          status: data.status || 'pending',
          totalProducts: productsCount.data().count,
          totalRevenue,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Vendor;
      })
    );
    
    return vendors;
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw new Error('Failed to fetch vendors');
  }
};

// Approve vendor
export const approveVendor = async (vendorId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'vendors', vendorId), {
      status: 'approved',
      approvedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error approving vendor:', error);
    throw new Error('Failed to approve vendor');
  }
};

// Suspend vendor
export const suspendVendor = async (vendorId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'vendors', vendorId), {
      status: 'suspended',
      suspendedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error suspending vendor:', error);
    throw new Error('Failed to suspend vendor');
  }
};

// Delete vendor
export const deleteVendor = async (vendorId: string): Promise<void> => {
  try {
    // Note: In production, you might want to soft delete or archive
    await deleteDoc(doc(db, 'vendors', vendorId));
  } catch (error) {
    console.error('Error deleting vendor:', error);
    throw new Error('Failed to delete vendor');
  }
};

// Get vendor by ID
export const getVendorById = async (vendorId: string): Promise<Vendor | null> => {
  try {
    const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
    
    if (!vendorDoc.exists()) {
      return null;
    }
    
    const data = vendorDoc.data();
    
    const productsQuery = query(
      collection(db, 'products'), 
      where('vendorId', '==', vendorId)
    );
    const productsCount = await getCountFromServer(productsQuery);
    
    return {
      id: vendorDoc.id,
      name: data.name,
      email: data.email,
      status: data.status,
      totalProducts: productsCount.data().count,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Vendor;
  } catch (error) {
    console.error('Error fetching vendor:', error);
    throw new Error('Failed to fetch vendor');
  }
};

// Get vendor statistics
export const getVendorStats = async () => {
  try {
    const vendorsQuery = query(collection(db, 'vendors'));
    const snapshot = await getDocs(vendorsQuery);
    
    const total = snapshot.size;
    const active = snapshot.docs.filter(doc => doc.data().status === 'approved').length;
    const pending = snapshot.docs.filter(doc => doc.data().status === 'pending').length;
    const suspended = snapshot.docs.filter(doc => doc.data().status === 'suspended').length;
    
    return { total, active, pending, suspended };
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    throw new Error('Failed to fetch vendor statistics');
  }
};
