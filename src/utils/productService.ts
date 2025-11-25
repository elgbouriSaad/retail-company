/**
 * Product Service - Database operations for products
 */

import { supabase, uploadFile, deleteFile } from '../lib/supabase';
import { Product } from '../types';

type SupabaseLike = {
  from: (table: string) => ReturnType<typeof supabase.from>;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
};

const supabaseLike = supabase as unknown as SupabaseLike;

type DbProductWithCategory = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  category_id?: string | null;
  images?: unknown;
  sizes?: unknown;
  stock?: number | null;
  availability?: boolean | null;
  created_at: string;
  categories?: {
    id: string;
    name: string | null;
    description: string | null;
    cover_image: string | null;
  };
};

const fromProducts = () => supabaseLike.from('products');

const callRpc = (fn: string, args?: Record<string, unknown>) => supabaseLike.rpc(fn, args);

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
};

const mapDbProductToProduct = (product: DbProductWithCategory): Product => ({
  id: product.id,
  name: product.name,
  description: product.description || '',
  price: Number(product.price) || 0,
  category: product.categories?.name || product.category || 'Général',
  categoryId: product.category_id || product.categories?.id,
  images: toStringArray(product.images),
  sizes: toStringArray(product.sizes),
  stock: product.stock ?? 0,
  availability: product.availability ?? true,
  createdAt: product.created_at,
});

export interface ProductInput {
  name: string;
  description?: string;
  categoryLabel?: string;
  categoryId?: string;
  price?: number;
  sizes?: string[];
  stock?: number;
  availability?: boolean;
  images?: File[];
}

/**
 * Fetch all products
 */
export async function fetchProducts(categoryId?: string): Promise<Product[]> {
  try {
    let query = fromProducts()
      .select(
        `
        *,
        categories (
          id,
          name,
          description,
          cover_image
        )
      `
      )
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const rows = (data || []) as DbProductWithCategory[];

    return rows.map(mapDbProductToProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await fromProducts()
      .select(
        `
        *,
        categories (
          id,
          name,
          description,
          cover_image
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) return null;

    const row = data as DbProductWithCategory;

    return mapDbProductToProduct(row);
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

/**
 * Create a new product with optional image uploads
 */
export async function createProduct(productData: ProductInput): Promise<Product> {
  try {
    // Upload images first if provided
    const imageUrls: string[] = [];
    if (productData.images && productData.images.length > 0) {
      for (const imageFile of productData.images) {
        const timestamp = Date.now();
        const path = `products/${timestamp}-${imageFile.name}`;
        const url = await uploadFile('product-images', path, imageFile);
        imageUrls.push(url);
      }
    }

    // Create product in database
    const categoryLabel = productData.categoryLabel || 'AUTRE';

    const { data, error } = await fromProducts()
      .insert({
        name: productData.name,
        description: productData.description || '',
        price: productData.price ?? 0,
        category: categoryLabel.toUpperCase(),
        category_id: productData.categoryId,
        sizes: productData.sizes ?? [],
        stock: productData.stock ?? 0,
        availability: productData.availability ?? true,
        images: imageUrls,
      })
      .select()
      .single();

    if (error) throw error;

    const row = data as DbProductWithCategory;
    return mapDbProductToProduct(row);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  updates: Partial<ProductInput>,
  newImages?: File[]
): Promise<Product> {
  try {
    // Upload new images if provided
    const uploadedImages: string[] = [];
    if (newImages && newImages.length > 0) {
      for (const imageFile of newImages) {
        const timestamp = Date.now();
        const path = `products/${timestamp}-${imageFile.name}`;
        const url = await uploadFile('product-images', path, imageFile);
        uploadedImages.push(url);
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.categoryLabel) updateData.category = updates.categoryLabel.toUpperCase();
    if (updates.categoryId) updateData.category_id = updates.categoryId;
    if (updates.sizes) updateData.sizes = updates.sizes;
    if (updates.stock !== undefined) updateData.stock = updates.stock;
    if (updates.availability !== undefined) updateData.availability = updates.availability;
    
    // If new images uploaded, append to existing or replace
    if (uploadedImages.length > 0) {
      const existing = await fetchProductById(id);
      updateData.images = [...(existing?.images || []), ...uploadedImages];
    }

    const { data, error } = await fromProducts()
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const row = data as DbProductWithCategory;
    return mapDbProductToProduct(row);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

/**
 * Delete a product and its images
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    // First, get the product to access its images
    const product = await fetchProductById(id);
    
    // Delete the product from database (CASCADE will handle order_items)
    const { error } = await fromProducts()
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Delete associated images from storage
    if (product && product.images.length > 0) {
      for (const imageUrl of product.images) {
        try {
          // Extract path from URL
          const urlParts = imageUrl.split('/');
          const bucketIndex = urlParts.indexOf('product-images');
          if (bucketIndex !== -1) {
            const path = urlParts.slice(bucketIndex + 1).join('/');
            await deleteFile('product-images', path);
          }
        } catch (imgError) {
          console.warn('Failed to delete image:', imageUrl, imgError);
          // Continue even if image deletion fails
        }
      }
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

/**
 * Search products by name or description
 */
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  try {
    const { data, error } = await callRpc('search_products', { search_term: searchTerm });

    if (error) throw error;

    const rows = (data || []) as DbProductWithCategory[];
    return rows.map(mapDbProductToProduct);
  } catch (error) {
    console.error('Error searching products:', error);
    // Fallback to client-side search if RPC not available
    return fetchProducts().then(products =>
      products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }
}

/**
 * Update product stock
 */
export async function updateProductStock(id: string, quantity: number): Promise<void> {
  try {
    const { error } = await fromProducts()
      .update({ stock: quantity })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}

/**
 * Toggle product availability
 */
export async function toggleProductAvailability(id: string, available: boolean): Promise<void> {
  try {
    const { error } = await fromProducts()
      .update({ availability: available })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error toggling product availability:', error);
    throw error;
  }
}

/**
 * Remove an image from a product
 */
export async function removeProductImage(productId: string, imageUrl: string): Promise<void> {
  try {
    const product = await fetchProductById(productId);
    if (!product) throw new Error('Product not found');

    const updatedImages = product.images.filter(url => url !== imageUrl);

    const { error } = await fromProducts()
      .update({ images: updatedImages })
      .eq('id', productId);

    if (error) throw error;

    // Delete image from storage
    try {
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.indexOf('product-images');
      if (bucketIndex !== -1) {
        const path = urlParts.slice(bucketIndex + 1).join('/');
        await deleteFile('product-images', path);
      }
    } catch (imgError) {
      console.warn('Failed to delete image from storage:', imgError);
    }
  } catch (error) {
    console.error('Error removing product image:', error);
    throw error;
  }
}

