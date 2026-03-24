import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { getUserById } from './firebaseServices';

export const loginAdmin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userData = await getUserById(userCredential.user.uid);
    
    if (!userData) {
      await signOut(auth);
      throw new Error('User data not found');
    }

    if (userData.role !== 'admin') {
      await signOut(auth);
      throw new Error('Access denied. Admin privileges required.');
    }

    return userData;
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
};

export const logoutAdmin = async () => {
  await signOut(auth);
};
