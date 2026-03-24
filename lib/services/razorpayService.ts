import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { RazorpaySettings } from '@/types';

export class RazorpayService {
  private static readonly COLLECTION = 'settings';
  private static readonly DOC_ID = 'razorpay';

  /**
   * Get Razorpay settings from Firestore
   * Used by both admin UI and backend API routes
   */
  static async getRazorpaySettings(): Promise<RazorpaySettings | null> {
    try {
      const settingsDoc = await getDoc(doc(db, this.COLLECTION, this.DOC_ID));
      
      if (!settingsDoc.exists()) {
        return null;
      }

      const data = settingsDoc.data();
      return {
        keyId: data.keyId || '',
        keySecret: data.keySecret || '',
        isActive: data.isActive || false,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error fetching Razorpay settings:', error);
      throw new Error('Failed to fetch Razorpay settings');
    }
  }

  /**
   * Update Razorpay settings in Firestore
   * Only accessible by admin users
   */
  static async updateRazorpaySettings(settings: Omit<RazorpaySettings, 'updatedAt'>): Promise<void> {
    try {
      if (!settings.keyId.trim()) {
        throw new Error('Razorpay Key ID is required');
      }

      if (!settings.keySecret.trim()) {
        throw new Error('Razorpay Key Secret is required');
      }

      // Validate Key ID format (starts with rzp_)
      if (!settings.keyId.startsWith('rzp_')) {
        throw new Error('Invalid Razorpay Key ID format. Must start with "rzp_"');
      }

      await updateDoc(doc(db, this.COLLECTION, this.DOC_ID), {
        keyId: settings.keyId.trim(),
        keySecret: settings.keySecret.trim(),
        isActive: settings.isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating Razorpay settings:', error);
      throw error;
    }
  }

  /**
   * Get masked Key Secret for display in admin UI
   */
  static maskKeySecret(keySecret: string): string {
    if (!keySecret || keySecret.length < 8) {
      return '••••••••';
    }
    
    const visibleChars = 4;
    const maskedPart = '•'.repeat(keySecret.length - visibleChars);
    return keySecret.substring(0, visibleChars) + maskedPart;
  }

  /**
   * Validate Razorpay credentials format
   */
  static validateCredentials(keyId: string, keySecret: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!keyId.trim()) {
      errors.push('Key ID is required');
    } else if (!keyId.startsWith('rzp_')) {
      errors.push('Key ID must start with "rzp_"');
    } else if (keyId.length < 20) {
      errors.push('Key ID appears to be too short');
    }

    if (!keySecret.trim()) {
      errors.push('Key Secret is required');
    } else if (keySecret.length < 20) {
      errors.push('Key Secret appears to be too short');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}