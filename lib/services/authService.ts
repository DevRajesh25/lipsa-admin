import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserRole } from '@/types';

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string;
  role: UserRole;
}

// Admin login
export const loginAdmin = async (email: string, password: string): Promise<AuthUser> => {
  try {
    // Set persistence to LOCAL
    await setPersistence(auth, browserLocalPersistence);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error('User data not found');
    }
    
    const userData = userDoc.data();
    
    if (userData.role !== 'admin') {
      await signOut(auth);
      throw new Error('Access denied. Admin privileges required.');
    }
    
    return {
      uid: user.uid,
      email: user.email,
      name: userData.name,
      role: userData.role,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
};

// Admin logout
export const logoutAdmin = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Logout failed');
  }
};

// Get current user with role
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      unsubscribe();
      
      if (!firebaseUser) {
        resolve(null);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (!userDoc.exists()) {
          resolve(null);
          return;
        }
        
        const userData = userDoc.data();
        
        resolve({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData.name,
          role: userData.role,
        });
      } catch (error) {
        resolve(null);
      }
    });
  });
};

// Create admin user (for initial setup)
export const createAdminUser = async (
  uid: string,
  email: string,
  name: string
): Promise<void> => {
  await setDoc(doc(db, 'users', uid), {
    email,
    name,
    role: 'admin',
    createdAt: new Date(),
  });
};
