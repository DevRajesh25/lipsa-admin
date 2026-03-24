import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  orderBy,
  Timestamp,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Coupon } from '@/types';

// Get all coupons
export const getAllCoupons = async (): Promise<Coupon[]> => {
  try {
    const couponsQuery = query(
      collection(db, 'coupons'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(couponsQuery);
    
    const coupons = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      
      return {
        id: docSnap.id,
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount || 0,
        maxDiscount: data.maxDiscount,
        expiryDate: data.expiryDate?.toDate() || new Date(),
        isActive: data.isActive ?? true,
        usageCount: data.usageCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Coupon;
    });
    
    return coupons;
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw new Error('Failed to fetch coupons');
  }
};

// Create coupon
export const createCoupon = async (couponData: {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: Date;
}): Promise<string> => {
  try {
    // Check if coupon code already exists
    const existingQuery = query(
      collection(db, 'coupons'),
      where('code', '==', couponData.code.toUpperCase())
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      throw new Error('Coupon code already exists');
    }
    
    const docRef = await addDoc(collection(db, 'coupons'), {
      code: couponData.code.toUpperCase(),
      discountType: couponData.discountType,
      discountValue: couponData.discountValue,
      minOrderAmount: couponData.minOrderAmount,
      maxDiscount: couponData.maxDiscount,
      expiryDate: Timestamp.fromDate(couponData.expiryDate),
      isActive: true,
      usageCount: 0,
      createdAt: Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    throw new Error(error.message || 'Failed to create coupon');
  }
};

// Update coupon
export const updateCoupon = async (
  couponId: string,
  updates: Partial<Coupon>
): Promise<void> => {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    if (updates.expiryDate) {
      updateData.expiryDate = Timestamp.fromDate(updates.expiryDate);
    }
    
    await updateDoc(doc(db, 'coupons', couponId), updateData);
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw new Error('Failed to update coupon');
  }
};

// Deactivate coupon
export const deactivateCoupon = async (couponId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'coupons', couponId), {
      isActive: false,
      deactivatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error deactivating coupon:', error);
    throw new Error('Failed to deactivate coupon');
  }
};

// Activate coupon
export const activateCoupon = async (couponId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'coupons', couponId), {
      isActive: true,
      activatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error activating coupon:', error);
    throw new Error('Failed to activate coupon');
  }
};

// Delete coupon
export const deleteCoupon = async (couponId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'coupons', couponId));
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw new Error('Failed to delete coupon');
  }
};

// Get coupon by code
export const getCouponByCode = async (code: string): Promise<Coupon | null> => {
  try {
    const couponQuery = query(
      collection(db, 'coupons'),
      where('code', '==', code.toUpperCase())
    );
    const snapshot = await getDocs(couponQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    
    return {
      id: docSnap.id,
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount || 0,
      maxDiscount: data.maxDiscount,
      expiryDate: data.expiryDate?.toDate() || new Date(),
      isActive: data.isActive ?? true,
      usageCount: data.usageCount || 0,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Coupon;
  } catch (error) {
    console.error('Error fetching coupon by code:', error);
    throw new Error('Failed to fetch coupon');
  }
};
