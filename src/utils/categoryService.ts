import { supabase } from '../lib/supabase';

export interface Category {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  articleCount?: number;
}

export interface CategoryInput {
  name: string;
  description?: string;
  coverImage?: File | string | null;
}

const bucket = 'category-images';

async function ensureCoverImage(
  categoryId: string,
  coverImage?: File | string | null
): Promise<string | undefined> {
  if (!coverImage) return undefined;
  if (typeof coverImage === 'string') return coverImage;
  const fileExt = coverImage.name.split('.').pop();
  const path = `categories/${categoryId}/${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, coverImage, { upsert: true });

  if (error) throw error;

  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl.publicUrl;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(`*, products:products(count)`)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => {
    const productCount = Array.isArray(row.products)
      ? row.products.reduce((sum, entry) => sum + (entry?.count ?? 0), 0)
      : row.products?.count ?? 0;

    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      coverImage: row.cover_image || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      articleCount: productCount,
    };
  });
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: input.name, description: input.description })
    .select('*')
    .single();

  if (error) throw error;

  let coverImage = data.cover_image;
  if (input.coverImage) {
    coverImage = await ensureCoverImage(data.id, input.coverImage);
    if (coverImage) {
      await supabase
        .from('categories')
        .update({ cover_image: coverImage })
        .eq('id', data.id);
    }
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    coverImage: coverImage || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    articleCount: 0,
  };
}

export async function updateCategory(
  categoryId: string,
  input: CategoryInput
): Promise<Category> {
  let coverImageUrl: string | undefined;
  if (input.coverImage) {
    coverImageUrl = await ensureCoverImage(categoryId, input.coverImage);
  }

  const payload: Record<string, unknown> = {
    name: input.name,
    description: input.description,
  };
  if (coverImageUrl) payload.cover_image = coverImageUrl;

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', categoryId)
    .select('*')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    coverImage: data.cover_image || coverImageUrl,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    articleCount: undefined,
  };
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) throw error;
}

