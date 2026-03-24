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
import { Order } from '@/types';

// Get all orders
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(ordersQuery);
    
    const orders = await Promise.all(
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
        
        return {
          id: docSnap.id,
          customerId: data.customerId,
          customerName,
          vendors: data.vendors || [],
          totalAmount: data.totalAmount || 0,
          paymentStatus: data.paymentStatus || 'pending',
          orderStatus: data.orderStatus || 'pending',
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order;
      })
    );
    
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }
};

// Get orders by status
export const getOrdersByStatus = async (status: string): Promise<Order[]> => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('orderStatus', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(ordersQuery);
    
    const orders = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        let customerName = 'Unknown';
        if (data.customerId) {
          const customerDoc = await getDoc(doc(db, 'users', data.customerId));
          if (customerDoc.exists()) {
            customerName = customerDoc.data().name || 'Unknown';
          }
        }
        
        return {
          id: docSnap.id,
          customerId: data.customerId,
          customerName,
          vendors: data.vendors || [],
          totalAmount: data.totalAmount || 0,
          paymentStatus: data.paymentStatus,
          orderStatus: data.orderStatus,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order;
      })
    );
    
    return orders;
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    throw new Error('Failed to fetch orders');
  }
};

// Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus: status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }
};

// Get order statistics
export const getOrderStats = async () => {
  try {
    const ordersQuery = query(collection(db, 'orders'));
    const snapshot = await getDocs(ordersQuery);
    
    const total = snapshot.size;
    const pending = snapshot.docs.filter(doc => doc.data().orderStatus === 'pending').length;
    const processing = snapshot.docs.filter(doc => doc.data().orderStatus === 'processing').length;
    const shipped = snapshot.docs.filter(doc => doc.data().orderStatus === 'shipped').length;
    const delivered = snapshot.docs.filter(doc => doc.data().orderStatus === 'delivered').length;
    const cancelled = snapshot.docs.filter(doc => doc.data().orderStatus === 'cancelled').length;
    
    // Calculate total revenue from delivered orders
    const totalRevenue = snapshot.docs
      .filter(doc => doc.data().orderStatus === 'delivered')
      .reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);
    
    return { 
      total, 
      pending, 
      processing, 
      shipped, 
      delivered, 
      cancelled,
      totalRevenue 
    };
  } catch (error) {
    console.error('Error fetching order stats:', error);
    throw new Error('Failed to fetch order statistics');
  }
};
