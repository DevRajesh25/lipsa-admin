import { 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification } from '@/types';

// Create notification for product approval
export const createProductApprovalNotification = async (
  vendorId: string,
  productName: string
): Promise<void> => {
  try {
    await addDoc(collection(db, 'notifications'), {
      vendorId,
      type: 'approved',
      title: 'Product Approved',
      message: `Your product "${productName}" has been approved and is now live on the platform.`,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating product approval notification:', error);
    throw new Error('Failed to create notification');
  }
};

// Create notification for product rejection
export const createProductRejectionNotification = async (
  vendorId: string,
  productName: string,
  reason?: string
): Promise<void> => {
  try {
    const message = reason 
      ? `Your product "${productName}" has been rejected. Reason: ${reason}`
      : `Your product "${productName}" has been rejected. Please review and resubmit.`;
    
    await addDoc(collection(db, 'notifications'), {
      vendorId,
      type: 'rejected',
      title: 'Product Rejected',
      message,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating product rejection notification:', error);
    throw new Error('Failed to create notification');
  }
};

// Create notification for payout approval
export const createPayoutApprovalNotification = async (
  vendorId: string,
  amount: number
): Promise<void> => {
  try {
    await addDoc(collection(db, 'notifications'), {
      vendorId,
      type: 'payout',
      title: 'Payout Processed',
      message: `Your payout request of ₹${amount.toLocaleString('en-IN')} has been approved and processed.`,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating payout approval notification:', error);
    throw new Error('Failed to create notification');
  }
};

// Create notification for payout rejection
export const createPayoutRejectionNotification = async (
  vendorId: string,
  amount: number,
  reason?: string
): Promise<void> => {
  try {
    const message = reason
      ? `Your payout request of ₹${amount.toLocaleString('en-IN')} has been rejected. Reason: ${reason}`
      : `Your payout request of ₹${amount.toLocaleString('en-IN')} has been rejected.`;
    
    await addDoc(collection(db, 'notifications'), {
      vendorId,
      type: 'payout',
      title: 'Payout Rejected',
      message,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating payout rejection notification:', error);
    throw new Error('Failed to create notification');
  }
};

// Create notification for return request
export const createReturnRequestNotification = async (
  vendorId: string,
  productName: string,
  orderId: string
): Promise<void> => {
  try {
    await addDoc(collection(db, 'notifications'), {
      vendorId,
      type: 'return',
      title: 'Return Request',
      message: `A customer has requested a return for "${productName}" (Order: ${orderId}).`,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating return request notification:', error);
    throw new Error('Failed to create notification');
  }
};

// Get notifications for a vendor
export const getVendorNotifications = async (vendorId: string): Promise<Notification[]> => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(notificationsQuery);
    
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      vendorId: doc.data().vendorId,
      type: doc.data().type,
      title: doc.data().title,
      message: doc.data().message,
      isRead: doc.data().isRead || false,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Notification[];
    
    return notifications;
  } catch (error) {
    console.error('Error fetching vendor notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

// Mark all notifications as read for a vendor
export const markAllNotificationsAsRead = async (vendorId: string): Promise<void> => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('vendorId', '==', vendorId),
      where('isRead', '==', false)
    );
    const snapshot = await getDocs(notificationsQuery);
    
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { isRead: true })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
};

// Get unread notification count for a vendor
export const getUnreadNotificationCount = async (vendorId: string): Promise<number> => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('vendorId', '==', vendorId),
      where('isRead', '==', false)
    );
    const snapshot = await getDocs(notificationsQuery);
    
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    throw new Error('Failed to fetch unread notification count');
  }
};
