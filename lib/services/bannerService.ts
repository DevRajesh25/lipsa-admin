import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Banner } from '@/types';

// Get all banners
export const getAllBanners = async (): Promise<Banner[]> => {
  try {
    const bannersQuery = query(
      collection(db, 'banners'),
      orderBy('position', 'asc')
    );
    const snapshot = await getDocs(bannersQuery);
    
    const banners = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      
      return {
        id: docSnap.id,
        title: data.title,
        imageUrl: data.imageUrl,
        link: data.link || '',
        position: data.position || 0,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Banner;
    });
    
    return banners;
  } catch (error) {
    console.error('Error fetching banners:', error);
    throw new Error('Failed to fetch banners');
  }
};

// Create banner
export const createBanner = async (
  title: string,
  link: string,
  imageFile: File,
  position: number = 0
): Promise<string> => {
  try {
    // Upload image to Firebase Storage
    const imageRef = ref(storage, `banners/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);
    
    const docRef = await addDoc(collection(db, 'banners'), {
      title,
      imageUrl,
      link,
      position,
      isActive: true,
      createdAt: Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating banner:', error);
    throw new Error('Failed to create banner');
  }
};

// Update banner
export const updateBanner = async (
  bannerId: string,
  title: string,
  link: string,
  position: number,
  imageFile?: File
): Promise<void> => {
  try {
    const updateData: any = {
      title,
      link,
      position,
      updatedAt: Timestamp.now(),
    };
    
    // Upload new image if provided
    if (imageFile) {
      const imageRef = ref(storage, `banners/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      updateData.imageUrl = await getDownloadURL(imageRef);
    }
    
    await updateDoc(doc(db, 'banners', bannerId), updateData);
  } catch (error) {
    console.error('Error updating banner:', error);
    throw new Error('Failed to update banner');
  }
};

// Toggle banner active status
export const toggleBannerStatus = async (bannerId: string, isActive: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, 'banners', bannerId), {
      isActive,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error toggling banner status:', error);
    throw new Error('Failed to toggle banner status');
  }
};

// Delete banner
export const deleteBanner = async (bannerId: string): Promise<void> => {
  try {
    // Get banner to delete image
    const bannerDoc = await doc(db, 'banners', bannerId);
    const bannerSnapshot = await getDocs(query(collection(db, 'banners')));
    const banner = bannerSnapshot.docs.find(doc => doc.id === bannerId);
    
    if (banner) {
      const data = banner.data();
      if (data.imageUrl) {
        try {
          // Extract path from URL and delete from storage
          const imageRef = ref(storage, data.imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting banner image:', error);
        }
      }
    }
    
    await deleteDoc(doc(db, 'banners', bannerId));
  } catch (error) {
    console.error('Error deleting banner:', error);
    throw new Error('Failed to delete banner');
  }
};

// Reorder banners
export const reorderBanners = async (bannerIds: string[]): Promise<void> => {
  try {
    const updatePromises = bannerIds.map((bannerId, index) => 
      updateDoc(doc(db, 'banners', bannerId), {
        position: index,
        updatedAt: Timestamp.now(),
      })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error reordering banners:', error);
    throw new Error('Failed to reorder banners');
  }
};
