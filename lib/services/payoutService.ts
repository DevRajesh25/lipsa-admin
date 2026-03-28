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
import { PayoutRequest } from '@/types';
import { 
  createPayoutApprovalNotification, 
  createPayoutRejectionNotification 
} from './notificationService';

// Get all payout requests
export const getAllPayoutRequests = async (): Promise<PayoutRequest[]> => {
  try {
    const payoutsQuery = query(
      collection(db, 'payoutRequests'),
      orderBy('requestDate', 'desc')
    );
    const snapshot = await getDocs(payoutsQuery);
    
    const payouts = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        // Get vendor name from vendors collection
        let vendorName = 'Unknown';
        if (data.vendorId) {
          const vendorDoc = await getDoc(doc(db, 'vendors', data.vendorId));
          if (vendorDoc.exists()) {
            vendorName = vendorDoc.data().name || 'Unknown';
          }
        }
        
        return {
          id: docSnap.id,
          vendorId: data.vendorId,
          vendorName,
          amount: data.amount,
          status: data.status || 'pending',
          requestDate: data.requestDate?.toDate() || new Date(),
          processedDate: data.processedDate?.toDate(),
        } as PayoutRequest;
      })
    );
    
    return payouts;
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    throw new Error('Failed to fetch payout requests');
  }
};

// Get payout requests by status
export const getPayoutRequestsByStatus = async (status: string): Promise<PayoutRequest[]> => {
  try {
    const payoutsQuery = query(
      collection(db, 'payoutRequests'),
      where('status', '==', status),
      orderBy('requestDate', 'desc')
    );
    const snapshot = await getDocs(payoutsQuery);
    
    const payouts = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        let vendorName = 'Unknown';
        if (data.vendorId) {
          const vendorDoc = await getDoc(doc(db, 'vendors', data.vendorId));
          if (vendorDoc.exists()) {
            vendorName = vendorDoc.data().name || 'Unknown';
          }
        }
        
        return {
          id: docSnap.id,
          vendorId: data.vendorId,
          vendorName,
          amount: data.amount,
          status: data.status,
          requestDate: data.requestDate?.toDate() || new Date(),
          processedDate: data.processedDate?.toDate(),
        } as PayoutRequest;
      })
    );
    
    return payouts;
  } catch (error) {
    console.error('Error fetching payout requests by status:', error);
    throw new Error('Failed to fetch payout requests');
  }
};

// Approve payout request
export const approvePayoutRequest = async (payoutId: string): Promise<void> => {
  try {
    // Get payout data to retrieve vendorId and amount
    const payoutDoc = await getDoc(doc(db, 'payoutRequests', payoutId));
    if (!payoutDoc.exists()) {
      throw new Error('Payout request not found');
    }
    
    const payoutData = payoutDoc.data();
    const vendorId = payoutData.vendorId;
    const amount = payoutData.amount;
    
    // Update payout status
    await updateDoc(doc(db, 'payoutRequests', payoutId), {
      status: 'approved',
      processedDate: Timestamp.now(),
    });
    
    // Create notification for vendor
    if (vendorId) {
      await createPayoutApprovalNotification(vendorId, amount);
    }
  } catch (error) {
    console.error('Error approving payout request:', error);
    throw new Error('Failed to approve payout request');
  }
};

// Reject payout request
export const rejectPayoutRequest = async (payoutId: string, reason?: string): Promise<void> => {
  try {
    // Get payout data to retrieve vendorId and amount
    const payoutDoc = await getDoc(doc(db, 'payoutRequests', payoutId));
    if (!payoutDoc.exists()) {
      throw new Error('Payout request not found');
    }
    
    const payoutData = payoutDoc.data();
    const vendorId = payoutData.vendorId;
    const amount = payoutData.amount;
    
    // Update payout status
    await updateDoc(doc(db, 'payoutRequests', payoutId), {
      status: 'rejected',
      processedDate: Timestamp.now(),
      rejectionReason: reason || 'Does not meet payout criteria',
    });
    
    // Create notification for vendor
    if (vendorId) {
      await createPayoutRejectionNotification(vendorId, amount, reason);
    }
  } catch (error) {
    console.error('Error rejecting payout request:', error);
    throw new Error('Failed to reject payout request');
  }
};

// Mark payout as paid
export const markPayoutAsPaid = async (payoutId: string): Promise<void> => {
  try {
    // Get payout data to retrieve vendorId and amount
    const payoutDoc = await getDoc(doc(db, 'payoutRequests', payoutId));
    if (!payoutDoc.exists()) {
      throw new Error('Payout request not found');
    }
    
    const payoutData = payoutDoc.data();
    const vendorId = payoutData.vendorId;
    const amount = payoutData.amount;
    
    // Update payout status
    await updateDoc(doc(db, 'payoutRequests', payoutId), {
      status: 'paid',
      paidDate: Timestamp.now(),
    });
    
    // Create notification for vendor (only if not already approved)
    if (vendorId && payoutData.status !== 'approved') {
      await createPayoutApprovalNotification(vendorId, amount);
    }
  } catch (error) {
    console.error('Error marking payout as paid:', error);
    throw new Error('Failed to mark payout as paid');
  }
};

// Get payout statistics
export const getPayoutStats = async () => {
  try {
    const payoutsQuery = query(collection(db, 'payoutRequests'));
    const snapshot = await getDocs(payoutsQuery);
    
    const total = snapshot.size;
    const pending = snapshot.docs.filter(doc => doc.data().status === 'pending').length;
    const approved = snapshot.docs.filter(doc => doc.data().status === 'approved').length;
    const rejected = snapshot.docs.filter(doc => doc.data().status === 'rejected').length;
    const paid = snapshot.docs.filter(doc => doc.data().status === 'paid').length;
    
    // Calculate total pending amount
    const pendingAmount = snapshot.docs
      .filter(doc => doc.data().status === 'pending')
      .reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    
    // Calculate total paid amount
    const paidAmount = snapshot.docs
      .filter(doc => doc.data().status === 'paid')
      .reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    
    return { 
      total, 
      pending, 
      approved, 
      rejected, 
      paid,
      pendingAmount,
      paidAmount
    };
  } catch (error) {
    console.error('Error fetching payout stats:', error);
    throw new Error('Failed to fetch payout statistics');
  }
};
