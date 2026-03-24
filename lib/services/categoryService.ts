import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  where,
  getCountFromServer,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Category } from '@/types';

// Get all categories
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const categoriesQuery = query(
      collection(db, 'categories'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(categoriesQuery);
    
    const categories = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        // Count products in this category
        const productsQuery = query(
          collection(db, 'products'),
          where('categoryId', '==', docSnap.id)
        );
        const productsCount = await getCountFromServer(productsQuery);
        
        return {
          id: docSnap.id,
          name: data.name,
          description: data.description || '',
          imageUrl: data.imageUrl || data.image || '', // Support both field names
          slug: data.slug || '',
          productCount: productsCount.data().count,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Category;
      })
    );
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }
};

// Add category
export const addCategory = async (
  name: string,
  description: string,
  imageFile?: File
): Promise<string> => {
  try {
    let imageUrl = '';
    
    // Upload image if provided
    if (imageFile) {
      const imageRef = ref(storage, `categories/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }
    
    const docRef = await addDoc(collection(db, 'categories'), {
      name,
      description,
      image: imageUrl,
      createdAt: Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw new Error('Failed to add category');
  }
};

// Update category
export const updateCategory = async (
  categoryId: string,
  name: string,
  description: string,
  imageFile?: File
): Promise<void> => {
  try {
    const updateData: any = {
      name,
      description,
      updatedAt: Timestamp.now(),
    };
    
    // Upload new image if provided
    if (imageFile) {
      const imageRef = ref(storage, `categories/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      updateData.image = await getDownloadURL(imageRef);
    }
    
    await updateDoc(doc(db, 'categories', categoryId), updateData);
  } catch (error) {
    console.error('Error updating category:', error);
    throw new Error('Failed to update category');
  }
};

// Delete category
export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    // Check if category has products
    const productsQuery = query(
      collection(db, 'products'),
      where('categoryId', '==', categoryId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    
    if (productsSnapshot.size > 0) {
      throw new Error('Cannot delete category with existing products');
    }
    
    // Get category to delete image
    const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
    if (categoryDoc.exists()) {
      const data = categoryDoc.data();
      if (data.image) {
        try {
          const imageRef = ref(storage, data.image);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting category image:', error);
        }
      }
    }
    
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error: any) {
    console.error('Error deleting category:', error);
    throw new Error(error.message || 'Failed to delete category');
  }
};

// Get category by ID
export const getCategoryById = async (categoryId: string): Promise<Category | null> => {
  try {
    const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
    
    if (!categoryDoc.exists()) {
      return null;
    }
    
    const data = categoryDoc.data();
    
    const productsQuery = query(
      collection(db, 'products'),
      where('categoryId', '==', categoryId)
    );
    const productsCount = await getCountFromServer(productsQuery);
    
    return {
      id: categoryDoc.id,
      name: data.name,
      description: data.description || '',
      imageUrl: data.imageUrl || data.image || '', // Support both field names
      slug: data.slug || '',
      productCount: productsCount.data().count,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Category;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw new Error('Failed to fetch category');
  }
};
// Update category product count (utility function)
export const updateCategoryProductCount = async (categoryId: string): Promise<void> => {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('categoryId', '==', categoryId)
    );
    const productsCount = await getCountFromServer(productsQuery);
    
    await updateDoc(doc(db, 'categories', categoryId), {
      productCount: productsCount.data().count,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating category product count:', error);
    // Don't throw error as this is a background operation
  }
};

// Get categories with fresh product counts (for admin dashboard)
export const getCategoriesWithFreshCounts = async (): Promise<Category[]> => {
  try {
    return await getAllCategories();
  } catch (error) {
    console.error('Error fetching categories with fresh counts:', error);
    throw new Error('Failed to fetch categories');
  }
};