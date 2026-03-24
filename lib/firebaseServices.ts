import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import type { 
  User, 
  Vendor, 
  Product, 
  Category, 
  Order, 
  Return, 
  Coupon, 
  Banner, 
  PayoutRequest 
} from '@/types';

// Helper to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

// USER SERVICES
export const getUserById = async (userId: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return null;
  const data = userDoc.data();
  return {
    id: userDoc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt)
  } as User;
};

export const getAllUsers = async (): Promise<User[]> => {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  return usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestamp(doc.data().createdAt)
  } as User));
};

export const updateUserStatus = async (userId: string, isBlocked: boolean): Promise<void> => {
  await updateDoc(doc(db, 'users', userId), { isBlocked });
};

// VENDOR SERVICES
export const getAllVendors = async (): Promise<Vendor[]> => {
  const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
  return vendorsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestamp(doc.data().createdAt)
  } as Vendor));
};

export const updateVendorStatus = async (
  vendorId: string, 
  status: 'pending' | 'approved' | 'suspended'
): Promise<void> => {
  await updateDoc(doc(db, 'vendors', vendorId), { status });
};

export const deleteVendor = async (vendorId: string): Promise<void> => {
  await deleteDoc(doc(db, 'vendors', vendorId));
};

// PRODUCT SERVICES
export const getAllProducts = async (): Promise<Product[]> => {
  const productsSnapshot = await getDocs(collection(db, 'products'));
  return productsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestamp(doc.data().createdAt)
  } as Product));
};

export const updateProductStatus = async (
  productId: string, 
  status: 'pending' | 'approved' | 'rejected'
): Promise<void> => {
  await updateDoc(doc(db, 'products', productId), { status });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await deleteDoc(doc(db, 'products', productId));
};

// CATEGORY SERVICES
export const getAllCategories = async (): Promise<Category[]> => {
  const categoriesSnapshot = await getDocs(collection(db, 'categories'));
  return categoriesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestamp(doc.data().createdAt)
  } as Category));
};

export const addCategory = async (category: Omit<Category, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'categories'), {
    ...category,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const updateCategory = async (categoryId: string, data: Partial<Category>): Promise<void> => {
  await updateDoc(doc(db, 'categories', categoryId), data);
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  await deleteDoc(doc(db, 'categories', categoryId));
};

// ORDER SERVICES
export const getAllOrders = async (): Promise<Order[]> => {
  const ordersSnapshot = await getDocs(
    query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
  );
  return ordersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestamp(doc.data().createdAt)
  } as Order));
};

export const updateOrderStatus = async (
  orderId: string, 
  orderStatus: Order['orderStatus']
): Promise<void> => {
  await updateDoc(doc(db, 'orders', orderId), { orderStatus });
};

// RETURN SERVICES
export const getAllReturns = async (): Promise<Return[]> => {
  const returnsSnapshot = await getDocs(
    query(collection(db, 'returns'), orderBy('createdAt', 'desc'))
  );
  return returnsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestamp(doc.data().createdAt)
  } as Return));
};

export const updateReturnStatus = async (
  returnId: string, 
  status: Return['status']
): Promise<void> => {
  await updateDoc(doc(db, 'returns', returnId), { status });
};

// COUPON SERVICES
export const getAllCoupons = async (): Promise<Coupon[]> => {
  const couponsSnapshot = await getDocs(collection(db, 'coupons'));
  return couponsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestamp(doc.data().createdAt),
    expiryDate: convertTimestamp(doc.data().expiryDate)
  } as Coupon));
};

export const addCoupon = async (coupon: Omit<Coupon, 'id' | 'createdAt' | 'usageCount'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'coupons'), {
    ...coupon,
    expiryDate: Timestamp.fromDate(coupon.expiryDate),
    usageCount: 0,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const updateCoupon = async (couponId: string, isActive: boolean): Promise<void> => {
  await updateDoc(doc(db, 'coupons', couponId), { isActive });
};

export const deleteCoupon = async (couponId: string): Promise<void> => {
  await deleteDoc(doc(db, 'coupons', couponId));
};

// BANNER SERVICES
export const getAllBanners = async (): Promise<Banner[]> => {
  const bannersSnapshot = await getDocs(
    query(collection(db, 'banners'), orderBy('position'))
  );
  return bannersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestamp(doc.data().createdAt)
  } as Banner));
};

export const uploadBannerImage = async (file: File): Promise<string> => {
  const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const addBanner = async (banner: Omit<Banner, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'banners'), {
    ...banner,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const updateBanner = async (bannerId: string, data: Partial<Banner>): Promise<void> => {
  await updateDoc(doc(db, 'banners', bannerId), data);
};

export const deleteBanner = async (bannerId: string, imageUrl: string): Promise<void> => {
  // Delete image from storage
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting banner image:', error);
  }
  // Delete document
  await deleteDoc(doc(db, 'banners', bannerId));
};

// PAYOUT SERVICES
export const getAllPayoutRequests = async (): Promise<PayoutRequest[]> => {
  const payoutsSnapshot = await getDocs(
    query(collection(db, 'payoutRequests'), orderBy('requestDate', 'desc'))
  );
  return payoutsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    requestDate: convertTimestamp(doc.data().requestDate),
    processedDate: doc.data().processedDate ? convertTimestamp(doc.data().processedDate) : undefined
  } as PayoutRequest));
};

export const updatePayoutStatus = async (
  payoutId: string, 
  status: PayoutRequest['status']
): Promise<void> => {
  await updateDoc(doc(db, 'payoutRequests', payoutId), { 
    status,
    processedDate: Timestamp.now()
  });
};

// DASHBOARD ANALYTICS
export const getDashboardStats = async () => {
  const [users, vendors, products, orders] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'vendors')),
    getDocs(collection(db, 'products')),
    getDocs(collection(db, 'orders'))
  ]);

  const activeVendors = vendors.docs.filter(doc => doc.data().status === 'approved').length;
  const pendingProducts = products.docs.filter(doc => doc.data().status === 'pending').length;
  const pendingOrders = orders.docs.filter(doc => doc.data().orderStatus === 'pending').length;

  const totalRevenue = orders.docs.reduce((sum, doc) => {
    const data = doc.data();
    return sum + (data.paymentStatus === 'paid' ? data.totalAmount : 0);
  }, 0);

  return {
    totalUsers: users.size,
    totalVendors: vendors.size,
    activeVendors,
    totalProducts: products.size,
    pendingProducts,
    totalOrders: orders.size,
    pendingOrders,
    totalRevenue,
    platformCommission: totalRevenue * 0.1 // Assuming 10% commission
  };
};
