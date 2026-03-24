// Cloudinary configuration and helper functions

export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!,
  apiSecret: process.env.CLOUDINARY_API_SECRET!,
};

// Upload preset for unsigned uploads (configure this in Cloudinary dashboard)
// IMPORTANT: You must create this preset in Cloudinary Console:
// Settings → Upload → Upload presets → Add upload preset
// Set "Signing Mode" to "Unsigned" and "Access mode" to "Public"
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

/**
 * Upload image to Cloudinary
 * @param file - File object to upload
 * @param folder - Optional folder name in Cloudinary
 * @returns Promise with upload result containing secure_url
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'products'
): Promise<{ secure_url: string; public_id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Cloudinary upload error:', errorData);
    throw new Error(
      errorData.error?.message || 
      `Failed to upload image to Cloudinary (${response.status}). Please check your upload preset configuration.`
    );
  }

  const data = await response.json();
  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
  };
}

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of File objects
 * @param folder - Optional folder name in Cloudinary
 * @returns Promise with array of upload results
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  folder: string = 'products'
): Promise<Array<{ secure_url: string; public_id: string }>> {
  const uploadPromises = files.map((file) => uploadToCloudinary(file, folder));
  return Promise.all(uploadPromises);
}

/**
 * Delete image from Cloudinary (requires server-side API call)
 * @param publicId - Public ID of the image to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  // This should be called from an API route for security
  const response = await fetch('/api/cloudinary/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publicId }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Get optimized image URL with transformations
 * @param publicId - Public ID of the image
 * @param transformations - Cloudinary transformation options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  transformations: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = transformations;

  let transformString = `q_${quality},f_${format}`;

  if (width) transformString += `,w_${width}`;
  if (height) transformString += `,h_${height}`;
  if (width || height) transformString += `,c_${crop}`;

  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformString}/${publicId}`;
}
