/**
 * Upload Service - File upload utilities
 */

import { supabase, uploadFile as supabaseUploadFile, deleteFile as supabaseDeleteFile } from '../lib/supabase';

/**
 * Upload product image
 */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const path = `products/${productId}/${timestamp}.${fileExt}`;
    
    const url = await supabaseUploadFile('product-images', path, file);
    return url;
  } catch (error) {
    console.error('Error uploading product image:', error);
    throw error;
  }
}

/**
 * Upload multiple product images
 */
export async function uploadProductImages(files: File[], productId: string): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadProductImage(file, productId));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading product images:', error);
    throw error;
  }
}

/**
 * Delete product image
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.indexOf('product-images');
    if (bucketIndex !== -1) {
      const path = urlParts.slice(bucketIndex + 1).join('/');
      await supabaseDeleteFile('product-images', path);
    }
  } catch (error) {
    console.error('Error deleting product image:', error);
    throw error;
  }
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const path = `${userId}/avatar.${fileExt}`;
    
    const url = await supabaseUploadFile('avatars', path, file);
    return url;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Delete user avatar
 */
export async function deleteAvatar(userId: string): Promise<void> {
  try {
    // Try common extensions
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    for (const ext of extensions) {
      try {
        await supabaseDeleteFile('avatars', `${userId}/avatar.${ext}`);
      } catch (e) {
        // Ignore errors, file might not exist
      }
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw error;
  }
}

/**
 * Upload custom order image
 */
export async function uploadCustomOrderImage(file: File, orderId: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const path = `orders/${orderId}/${timestamp}.${fileExt}`;
    
    const url = await supabaseUploadFile('custom-order-images', path, file);
    return url;
  } catch (error) {
    console.error('Error uploading custom order image:', error);
    throw error;
  }
}

/**
 * Upload multiple custom order images
 */
export async function uploadCustomOrderImages(files: File[], orderId: string): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadCustomOrderImage(file, orderId));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading custom order images:', error);
    throw error;
  }
}

/**
 * Delete custom order image
 */
export async function deleteCustomOrderImage(imageUrl: string): Promise<void> {
  try {
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.indexOf('custom-order-images');
    if (bucketIndex !== -1) {
      const path = urlParts.slice(bucketIndex + 1).join('/');
      await supabaseDeleteFile('custom-order-images', path);
    }
  } catch (error) {
    console.error('Error deleting custom order image:', error);
    throw error;
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.',
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit.`,
    };
  }

  return { valid: true };
}

/**
 * Validate multiple image files
 */
export function validateImageFiles(files: File[], maxSizeMB: number = 10): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  files.forEach((file, index) => {
    const result = validateImageFile(file, maxSizeMB);
    if (!result.valid && result.error) {
      errors.push(`File ${index + 1}: ${result.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Compress image before upload (client-side)
 */
export async function compressImage(file: File, maxWidth: number = 1200): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Scale down if necessary
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          0.8 // Quality 80%
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Get file extension from URL
 */
export function getFileExtensionFromUrl(url: string): string | null {
  try {
    const parts = url.split('.');
    return parts.length > 1 ? parts[parts.length - 1].split('?')[0] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get filename from URL
 */
export function getFilenameFromUrl(url: string): string | null {
  try {
    const parts = url.split('/');
    return parts[parts.length - 1].split('?')[0];
  } catch (error) {
    return null;
  }
}

