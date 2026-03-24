import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  getDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Return } from '@/types';
import { createReturnRequestNotification } from './notificationService';

// Get all returns
export const getAllReturns = async (): Promise<Return[]> => {
  try {
    const returnsQuery = query(
      collection(db, 'returns'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(returnsQuery);
    
    const returns = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        // Get customer name
        let customerName = 'Unknown';
        if (data.customerId) {
          const customerDoc = await getDoc(doc(db, 'users', data.customerId));
          if (customerDoc.exists()) {
            customerName = customerDoc.data().name || 'Unknown';
          }
        }
        
        // Get product name
        let productName = 'Unknown';
        if (data.productId) {
          const productDoc = await getDoc(doc(db, 'products', data.productId));
          if (productDoc.exists()) {
            productName = productDoc.data().name || 'Unknown';
          }
        }
        
        return {
          id: docSnap.id,
          orderId: data.orderId,
          customerId: data.customerId,
          customerName,
          productId: data.productId,
          productName,
          reason: data.reason,
          status: data.status || 'pending',
          refundAmount: data.refundAmount || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Return;
      })
    );
    
    return returns;
  } catch (error) {
    console.error('Error fetching returns:', error);
    throw new Error('Failed to fetch returns');
  }
};

// Get returns by status
export const getReturnsByStatus = async (status: string): Promise<Return[]> => {
  try {
    const returnsQuery = query(
      collection(db, 'returns'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(returnsQuery);
    
    const returns = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        let customerName = 'Unknown';
        if (data.customerId) {
          const customerDoc = await getDoc(doc(db, 'users', data.customerId));
          if (customerDoc.exists()) {
            customerName = customerDoc.data().name || 'Unknown';
          }
        }
        
        let productName = 'Unknown';
        if (data.productId) {
          const productDoc = await getDoc(doc(db, 'products', data.productId));
          if (productDoc.exists()) {
            productName = productDoc.data().name || 'Unknown';
          }
        }
        
        return {
          id: docSnap.id,
          orderId: data.orderId,
          customerId: data.customerId,
          customerName,
          productId: data.productId,
          productName,
          reason: data.reason,
          status: data.status,
          refundAmount: data.refundAmount || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Return;
      })
    );
    
    return returns;
  } catch (error) {
    console.error('Error fetching returns by status:', error);
    throw new Error('Failed to fetch returns');
  }
};

// Approve return
export const approveReturn = async (returnId: string): Promise<void> => {
  try {
    // Get return data to notify vendor
    const returnDoc = await getDoc(doc(db, 'returns', returnId));
    if (!returnDoc.exists()) {
      throw new Error('Return not found');
    }
    
    const returnData = returnDoc.data();
    
    // Get product to find vendorId
    if (returnData.productId) {
      const productDoc = await getDoc(doc(db, 'products', returnData.productId));
      if (productDoc.exists()) {
        const productData = productDoc.data();
        const vendorId = productData.vendorId;
        const productName = productData.name;
        const orderId = returnData.orderId;
        
        // Notify vendor about the return request
        if (vendorId && returnData.status === 'pending') {
          await createReturnRequestNotification(vendorId, productName, orderId);
        }
      }
    }
    
    // Update return status
    await updateDoc(doc(db, 'returns', returnId), {
      status: 'approved',
      approvedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error approving return:', error);
    throw new Error('Failed to approve return');
  }
};

// Reject return
export const rejectReturn = async (returnId: string, reason?: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'returns', returnId), {
      status: 'rejected',
      rejectedAt: Timestamp.now(),
      rejectionReason: reason || 'Does not meet return policy',
    });
  } catch (error) {
    console.error('Error rejecting return:', error);
    throw new Error('Failed to reject return');
  }
};

// Process refund
export const processRefund = async (returnId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'returns', returnId), {
      status: 'refunded',
      refundedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund');
  }
};

// Get return statistics
export const getReturnStats = async () => {
  try {
    const returnsQuery = query(collection(db, 'returns'));
    const snapshot = await getDocs(returnsQuery);
    
    const total = snapshot.size;
    const pending = snapshot.docs.filter(doc => doc.data().status === 'pending').length;
    const approved = snapshot.docs.filter(doc => doc.data().status === 'approved').length;
    const rejected = snapshot.docs.filter(doc => doc.data().status === 'rejected').length;
    const refunded = snapshot.docs.filter(doc => doc.data().status === 'refunded').length;
    
    return { total, pending, approved, rejected, refunded };
  } catch (error) {
    console.error('Error fetching return stats:', error);
    throw new Error('Failed to fetch return statistics');
  }
};
