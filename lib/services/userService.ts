import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(usersQuery);
    
    const users = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      
      return {
        id: docSnap.id,
        email: data.email,
        name: data.name,
        role: data.role,
        isBlocked: data.isBlocked || false,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as User;
    });
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

// Get users by role
export const getUsersByRole = async (role: 'admin' | 'vendor' | 'customer'): Promise<User[]> => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(usersQuery);
    
    const users = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      
      return {
        id: docSnap.id,
        email: data.email,
        name: data.name,
        role: data.role,
        isBlocked: data.isBlocked || false,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as User;
    });
    
    return users;
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw new Error('Failed to fetch users');
  }
};

// Block user
export const blockUser = async (userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isBlocked: true,
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    throw new Error('Failed to block user');
  }
};

// Unblock user
export const unblockUser = async (userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isBlocked: false,
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw new Error('Failed to unblock user');
  }
};

// Get user statistics
export const getUserStats = async () => {
  try {
    const usersQuery = query(collection(db, 'users'));
    const snapshot = await getDocs(usersQuery);
    
    const total = snapshot.size;
    const admins = snapshot.docs.filter(doc => doc.data().role === 'admin').length;
    const vendors = snapshot.docs.filter(doc => doc.data().role === 'vendor').length;
    const customers = snapshot.docs.filter(doc => doc.data().role === 'customer').length;
    const blocked = snapshot.docs.filter(doc => doc.data().isBlocked === true).length;
    
    return { total, admins, vendors, customers, blocked };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw new Error('Failed to fetch user statistics');
  }
};
