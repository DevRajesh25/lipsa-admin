import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import { updateCategoryProductCount } from './categoryService';
import { 
  createProductApprovalNotification, 
  createProductRejectionNotification 
} from './notificationService';

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(productsQuery);
    
    const products = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        // Get vendor name
        let vendorName = 'Unknown';
        if (data.vendorId) {
          const vendorDoc = await getDoc(doc(db, 'vendors', data.vendorId));
          if (vendorDoc.exists()) {
            const vendorData = vendorDoc.data();
            vendorName = vendorData.name || vendorData.storeName || 'Unknown';
          }
        }
        
        return {
          id: docSnap.id,
          name: data.name,
          vendorId: data.vendorId,
          vendorName,
          categoryId: data.categoryId || '',
          price: data.price,
          stock: data.stock,
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Product;
      })
    );
    
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
};

// Get products by status
export const getProductsByStatus = async (status: 'pending' | 'approved' | 'rejected'): Promise<Product[]> => {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(productsQuery);
    
    const products = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        let vendorName = 'Unknown';
        if (data.vendorId) {
          const vendorDoc = await getDoc(doc(db, 'vendors', data.vendorId));
          if (vendorDoc.exists()) {
            const vendorData = vendorDoc.data();
            vendorName = vendorData.name || vendorData.storeName || 'Unknown';
          }
        }
        
        return {
          id: docSnap.id,
          name: data.name,
          vendorId: data.vendorId,
          vendorName,
          categoryId: data.categoryId || '',
          price: data.price,
          stock: data.stock,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Product;
      })
    );
    
    return products;
  } catch (error) {
    console.error('Error fetching products by status:', error);
    throw new Error('Failed to fetch products');
  }
};

// Approve product
export const approveProduct = async (productId: string): Promise<void> => {
  try {
    // Get product data to retrieve vendorId and product name
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (!productDoc.exists()) {
      throw new Error('Product not found');
    }
    
    const productData = productDoc.data();
    const vendorId = productData.vendorId;
    const productName = productData.name;
    
    // Update product status
    await updateDoc(doc(db, 'products', productId), {
      status: 'approved',
      approvedAt: Timestamp.now(),
    });
    
    // Create notification for vendor
    if (vendorId) {
      await createProductApprovalNotification(vendorId, productName);
    }
  } catch (error) {
    console.error('Error approving product:', error);
    throw new Error('Failed to approve product');
  }
};

// Reject product
export const rejectProduct = async (productId: string, reason?: string): Promise<void> => {
  try {
    // Get product data to retrieve vendorId and product name
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (!productDoc.exists()) {
      throw new Error('Product not found');
    }
    
    const productData = productDoc.data();
    const vendorId = productData.vendorId;
    const productName = productData.name;
    
    // Update product status
    await updateDoc(doc(db, 'products', productId), {
      status: 'rejected',
      rejectedAt: Timestamp.now(),
      rejectionReason: reason || 'Does not meet platform standards',
    });
    
    // Create notification for vendor
    if (vendorId) {
      await createProductRejectionNotification(vendorId, productName, reason);
    }
  } catch (error) {
    console.error('Error rejecting product:', error);
    throw new Error('Failed to reject product');
  }
};

// Delete product
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    // Get product data before deletion to update category count
    const productDoc = await getDoc(doc(db, 'products', productId));
    const categoryId = productDoc.exists() ? productDoc.data().categoryId : null;
    
    await deleteDoc(doc(db, 'products', productId));
    
    // Update category product count
    if (categoryId) {
      await updateCategoryProductCount(categoryId);
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product');
  }
};

// Get product statistics
export const getProductStats = async () => {
  try {
    const allProductsQuery = query(collection(db, 'products'));
    const allSnapshot = await getDocs(allProductsQuery);
    
    const total = allSnapshot.size;
    const pending = allSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
    const approved = allSnapshot.docs.filter(doc => doc.data().status === 'approved').length;
    const rejected = allSnapshot.docs.filter(doc => doc.data().status === 'rejected').length;
    
    return { total, pending, approved, rejected };
  } catch (error) {
    console.error('Error fetching product stats:', error);
    throw new Error('Failed to fetch product statistics');
  }
};
