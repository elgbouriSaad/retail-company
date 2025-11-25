import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Search,
  ImagePlus,
  Folder,
  Layers,
  Package,
  Tag,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { CategorySummary, Product } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../utils/categoryService';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  removeProductImage,
} from '../../utils/productService';

const emptyCategoryForm = {
  name: '',
  description: '',
  coverFile: null as File | null,
  coverPreview: '' as string,
  currentCover: '' as string,
};

const emptyProductForm = {
  name: '',
  description: '',
  categoryId: '',
  images: [] as File[],
  imagePreviews: [] as string[],
  existingImages: [] as string[],
};

export const CatalogueManagement: React.FC = () => {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [drilledCategoryId, setDrilledCategoryId] = useState<string | null>(null);

  const [categoryModal, setCategoryModal] = useState({
    open: false,
    editingId: null as string | null,
    ...emptyCategoryForm,
  });

  const [productModal, setProductModal] = useState({
    open: false,
    editing: null as Product | null,
    ...emptyProductForm,
  });

  const selectedCategory = useMemo(
    () => categories.find(cat => cat.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const visibleProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    const products = productsByCategory[selectedCategoryId] || [];
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      product =>
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term)
    );
  }, [productsByCategory, searchTerm, selectedCategoryId]);

  const cleanupCategoryPreview = (url?: string) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  const cleanupProductPreviews = (urls: string[]) => {
    urls.forEach(url => URL.revokeObjectURL(url));
  };

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const data = await fetchCategories();
      setCategories(data);
      if (data.length === 0) {
        setSelectedCategoryId(null);
        return;
      }

      if (selectedCategoryId && data.some(cat => cat.id === selectedCategoryId)) {
        return;
      }
      setSelectedCategoryId(data[0].id);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Impossible de charger les catégories.');
    } finally {
      setLoadingCategories(false);
    }
  }, [selectedCategoryId]);

  const loadProductsForCategory = useCallback(
    async (categoryId: string, force = false) => {
      if (!categoryId) return;
      if (!force && productsByCategory[categoryId]) return;

      try {
        setLoadingProducts(true);
        const data = await fetchProducts(categoryId);
        setProductsByCategory(prev => ({ ...prev, [categoryId]: data }));
      } catch (error) {
        console.error('Error loading products:', error);
        alert('Impossible de charger les articles de cette catégorie.');
      } finally {
        setLoadingProducts(false);
      }
    },
    [productsByCategory]
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (selectedCategoryId) {
      loadProductsForCategory(selectedCategoryId);
    }
  }, [selectedCategoryId, loadProductsForCategory]);

  const openCategoryModal = (category?: CategorySummary) => {
    cleanupCategoryPreview(categoryModal.coverPreview);
    if (category) {
      setCategoryModal({
        open: true,
        editingId: category.id,
        name: category.name,
        description: category.description || '',
        coverFile: null,
        coverPreview: '',
        currentCover: category.coverImage || '',
      });
    } else {
      setCategoryModal({
        open: true,
        editingId: null,
        ...emptyCategoryForm,
      });
    }
  };

  const closeCategoryModal = () => {
    cleanupCategoryPreview(categoryModal.coverPreview);
    setCategoryModal({
      open: false,
      editingId: null,
      ...emptyCategoryForm,
    });
  };

  const handleCategoryCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    cleanupCategoryPreview(categoryModal.coverPreview);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCategoryModal(prev => ({
        ...prev,
        coverFile: file,
        coverPreview: previewUrl,
      }));
    } else {
      setCategoryModal(prev => ({
        ...prev,
        coverFile: null,
        coverPreview: '',
      }));
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryModal.name.trim()) {
      alert('Veuillez saisir un nom pour la catégorie.');
      return;
    }

    try {
      if (categoryModal.editingId) {
        await updateCategory(categoryModal.editingId, {
          name: categoryModal.name.trim(),
          description: categoryModal.description.trim() || undefined,
          coverImage: categoryModal.coverFile || undefined,
        });
        alert('Catégorie mise à jour avec succès !');
      } else {
        await createCategory({
          name: categoryModal.name.trim(),
          description: categoryModal.description.trim() || undefined,
          coverImage: categoryModal.coverFile,
        });
        alert('Catégorie créée avec succès !');
      }
      await loadCategories();
      closeCategoryModal();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Erreur lors de la sauvegarde de la catégorie.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Supprimer cette catégorie et ses articles ?')) return;

    try {
      await deleteCategory(categoryId);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setProductsByCategory(prev => {
        const clone = { ...prev };
        delete clone[categoryId];
        return clone;
      });
      if (selectedCategoryId === categoryId) {
        const remaining = categories.filter(cat => cat.id !== categoryId);
        setSelectedCategoryId(remaining[0]?.id ?? null);
      }
      alert('Catégorie supprimée avec succès !');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Impossible de supprimer cette catégorie.');
    }
  };

  const openProductModal = (product?: Product) => {
    if (!selectedCategoryId && !product) {
      alert('Veuillez d\'abord sélectionner une catégorie.');
      return;
    }

    cleanupProductPreviews(productModal.imagePreviews);

    if (product) {
      setProductModal({
        open: true,
        editing: product,
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId || selectedCategoryId || '',
        images: [],
        imagePreviews: [],
        existingImages: product.images || [],
      });
    } else {
      setProductModal({
        open: true,
        editing: null,
        ...emptyProductForm,
        categoryId: selectedCategoryId || '',
      });
    }
  };

  const closeProductModal = () => {
    cleanupProductPreviews(productModal.imagePreviews);
    setProductModal({
      open: false,
      editing: null,
      ...emptyProductForm,
      categoryId: selectedCategoryId || '',
    });
  };

  const handleProductImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const previews = newFiles.map(file => URL.createObjectURL(file));

    setProductModal(prev => ({
      ...prev,
      images: [...prev.images, ...newFiles],
      imagePreviews: [...prev.imagePreviews, ...previews],
    }));
  };

  const handleRemoveNewProductImage = (index: number) => {
    const preview = productModal.imagePreviews[index];
    if (preview) URL.revokeObjectURL(preview);

    setProductModal(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
      imagePreviews: prev.imagePreviews.filter((_, idx) => idx !== index),
    }));
  };

  const handleRemoveExistingImage = async (imageUrl: string) => {
    if (!productModal.editing) return;
    if (!confirm('Supprimer cette image ?')) return;

    try {
      await removeProductImage(productModal.editing.id, imageUrl);
      await loadProductsForCategory(productModal.editing.categoryId || selectedCategoryId || '', true);
      setProductModal(prev => ({
        ...prev,
        existingImages: prev.existingImages.filter(url => url !== imageUrl),
      }));
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Impossible de supprimer cette image.');
    }
  };

  const handleSaveProduct = async () => {
    if (!productModal.name.trim() || !productModal.categoryId) {
      alert('Veuillez remplir le nom et choisir une catégorie.');
      return;
    }

    const categoryLabel =
      categories.find(cat => cat.id === productModal.categoryId)?.name || 'Autre';

    const payload = {
      name: productModal.name.trim(),
      description: productModal.description.trim() || undefined,
      categoryLabel,
      categoryId: productModal.categoryId,
    };

    try {
      if (productModal.editing) {
        await updateProduct(productModal.editing.id, payload, productModal.images);
        alert('Article mis à jour avec succès !');
      } else {
        await createProduct({
          ...payload,
          availability: true,
          images: productModal.images,
        });
        alert('Article ajouté avec succès !');
      }

      cleanupProductPreviews(productModal.imagePreviews);
      closeProductModal();
      await loadProductsForCategory(payload.categoryId, true);
      await loadCategories();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Impossible de sauvegarder cet article.');
    }
  };

  const handleDeleteProduct = async (productId: string, categoryId?: string) => {
    if (!confirm('Supprimer cet article ?')) return;

    try {
      await deleteProduct(productId);
      alert('Article supprimé avec succès !');
      await loadProductsForCategory(categoryId || selectedCategoryId || '', true);
      await loadCategories();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Impossible de supprimer cet article.');
    }
  };

  const categoryCards = (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {categories.map(category => {
        const isActive = selectedCategoryId === category.id;
        return (
          <div
            key={category.id}
            className={`rounded-2xl border bg-gradient-to-b from-slate-900 to-slate-950 cursor-pointer transition-all ${
              isActive ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-800'
            }`}
            onClick={() => {
              setSelectedCategoryId(category.id);
              setDrilledCategoryId(category.id);
            }}
          >
            <div className="relative h-40 overflow-hidden rounded-t-2xl bg-slate-900">
              {category.coverImage ? (
                <img
                  src={category.coverImage}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-blue-500/20 flex items-center justify-center">
                  <Folder className="w-10 h-10 text-white/60" />
                </div>
              )}
              <span className="absolute top-4 right-4 inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-slate-900/80 text-white/80 backdrop-blur">
                <Package className="w-3 h-3 mr-1" />
                {category.articleCount ?? 0} articles
              </span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-white text-lg font-semibold truncate">{category.name}</h3>
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {new Date(category.createdAt).toLocaleDateString()}
                </span>
              </div>
              {category.description ? (
                <p className="text-slate-400 text-sm line-clamp-2">{category.description}</p>
              ) : (
                <p className="text-slate-500 text-sm italic">Aucune description</p>
              )}
              <div className="flex items-center justify-between pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={e => {
                    e.stopPropagation();
                    openProductModal();
                    setProductModal(prev => ({ ...prev, categoryId: category.id }));
                  }}
                >
                  <ImagePlus className="w-4 h-4 mr-1" />
                  Ajouter un article
                </Button>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={e => {
                      e.stopPropagation();
                      openCategoryModal(category);
                    }}
                  >
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button
        onClick={() => openCategoryModal()}
        className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-slate-400 hover:border-blue-500 hover:text-white transition-all flex flex-col items-center justify-center min-h-[260px]"
      >
        <Plus className="w-10 h-10 mb-4" />
        Créer une nouvelle catégorie
      </button>
    </div>
  );

  const renderProducts = () => {
    if (!selectedCategory) {
      return (
        <Card>
          <div className="py-12 text-center space-y-2">
            <Layers className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-white font-semibold">Aucune catégorie sélectionnée</p>
            <p className="text-slate-400 text-sm">
              Créez ou sélectionnez une catégorie pour commencer à ajouter des articles.
            </p>
          </div>
        </Card>
      );
    }

    if (loadingProducts && !(productsByCategory[selectedCategory.id]?.length)) {
      return (
        <Card>
          <div className="py-16 text-center text-slate-400">Chargement des articles...</div>
        </Card>
      );
    }

    if (visibleProducts.length === 0) {
      return (
        <Card>
          <div className="py-16 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-white font-semibold">Aucun article trouvé</p>
            <p className="text-slate-400 text-sm">
              Ajoutez un nouvel article ou modifiez votre recherche.
            </p>
            <Button onClick={() => openProductModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un article
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visibleProducts.map(product => (
          <div
            key={product.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col overflow-hidden"
          >
            <div className="relative h-48 bg-slate-900">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <ImagePlus className="w-10 h-10 text-white/60" />
                </div>
              )}
            </div>
            <div className="p-5 space-y-3 flex-1">
              <div className="space-y-2">
                <h3 className="text-white text-lg font-semibold">{product.name}</h3>
                <p className="text-slate-400 text-sm line-clamp-3">
                  {product.description || 'Aucune description'}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="inline-flex items-center">
                  <Tag className="w-3 h-3 mr-1" />
                  {product.category}
                </span>
                <span className="inline-flex items-center">
                  <Package className="w-3 h-3 mr-1" />
                  {product.images?.length ?? 0} image(s)
                </span>
              </div>
            </div>
            <div className="border-t border-slate-800 p-4 flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => openProductModal(product)}>
                Modifier
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDeleteProduct(product.id, product.categoryId)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion du Catalogue</h1>
          <p className="text-slate-400">Organisez vos catégories et articles avec un aperçu visuel.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => loadCategories()}>
            Rafraîchir
          </Button>
          <Button icon={Plus} onClick={() => openCategoryModal()}>
            Nouvelle Catégorie
          </Button>
        </div>
      </div>

      {loadingCategories ? (
        <Card>
          <div className="py-16 text-center text-slate-400">Chargement des catégories...</div>
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <div className="py-16 text-center space-y-3">
            <Folder className="w-12 h-12 text-slate-500 mx-auto" />
            <p className="text-white font-semibold">Aucune catégorie pour le moment</p>
            <p className="text-slate-400 text-sm">
              Créez votre première catégorie pour commencer à ajouter des articles.
            </p>
            <Button onClick={() => openCategoryModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une catégorie
            </Button>
          </div>
        </Card>
      ) : drilledCategoryId ? (
        <Card className="bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-white text-2xl font-semibold">
                {categories.find(cat => cat.id === drilledCategoryId)?.name || 'Articles'}
              </h2>
              <p className="text-slate-400 text-sm">
                Vous êtes à l’intérieur de cette catégorie. Cliquez sur Retour pour voir
                toutes les catégories.
              </p>
            </div>
            <Button variant="ghost" onClick={() => setDrilledCategoryId(null)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Retour aux catégories
            </Button>
          </div>
        </Card>
      ) : (
        categoryCards
      )}

      {drilledCategoryId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-white text-2xl font-semibold">
                Articles • {selectedCategory?.name || 'Liste'}
              </h2>
              <p className="text-slate-400 text-sm">
                {visibleProducts.length} article(s){' '}
                {selectedCategory ? `dans ${selectedCategory.name}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => setDrilledCategoryId(null)}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Retour aux catégories
              </Button>
              <Button variant="ghost" onClick={() => openCategoryModal(selectedCategory || undefined)}>
                Modifier la catégorie
              </Button>
              <Button icon={Plus} onClick={() => openProductModal()}>
                Ajouter un article
              </Button>
            </div>
          </div>

          <Card>
            <div className="flex flex-wrap items-center gap-4">
              <Input
                placeholder="Rechercher des articles..."
                value={searchTerm}
                onChange={setSearchTerm}
                icon={Search}
              />
              <div className="text-slate-400 text-sm">
                {selectedCategory
                  ? `${visibleProducts.length} article(s) affiché(s)`
                  : 'Sélectionnez une catégorie'}
              </div>
            </div>
          </Card>

          {renderProducts()}
        </div>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={categoryModal.open}
        onClose={closeCategoryModal}
        title={categoryModal.editingId ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nom"
            value={categoryModal.name}
            onChange={value => setCategoryModal(prev => ({ ...prev, name: value }))}
            placeholder="Salon, Chambre, etc."
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={categoryModal.description}
              onChange={event =>
                setCategoryModal(prev => ({ ...prev, description: event.target.value }))
              }
              placeholder="Décrivez rapidement cette catégorie"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Image de couverture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCategoryCoverChange}
              className="w-full text-slate-300 text-sm"
            />
            <div className="mt-2">
              {categoryModal.coverPreview || categoryModal.currentCover ? (
                <img
                  src={categoryModal.coverPreview || categoryModal.currentCover}
                  alt="Prévisualisation"
                  className="w-full h-40 object-cover rounded-lg border border-slate-700"
                />
              ) : (
                <div className="w-full h-40 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-dashed border-slate-600">
                  Aucune image sélectionnée
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={closeCategoryModal}>
              Annuler
            </Button>
            <Button onClick={handleSaveCategory}>
              {categoryModal.editingId ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Product Modal */}
      <Modal
        isOpen={productModal.open}
        onClose={closeProductModal}
        title={productModal.editing ? 'Modifier l\'Article' : 'Nouvel Article'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nom"
            value={productModal.name}
            onChange={value => setProductModal(prev => ({ ...prev, name: value }))}
            placeholder="Nom de l'article"
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={productModal.description}
              onChange={event =>
                setProductModal(prev => ({ ...prev, description: event.target.value }))
              }
              placeholder="Décrivez l'article"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Catégorie</label>
            <select
              value={productModal.categoryId}
              onChange={event =>
                setProductModal(prev => ({ ...prev, categoryId: event.target.value }))
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Images (vous pouvez en sélectionner plusieurs)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleProductImagesChange}
              className="w-full text-slate-300 text-sm"
            />
            {(productModal.imagePreviews.length > 0 || productModal.existingImages.length > 0) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {productModal.existingImages.map(url => (
                  <div key={`existing-${url}`} className="relative group">
                    <img src={url} alt="Produit" className="w-full h-28 object-cover rounded-lg" />
                    <button
                      className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                      onClick={() => handleRemoveExistingImage(url)}
                    >
                      Retirer
                    </button>
                  </div>
                ))}
                {productModal.imagePreviews.map((preview, index) => (
                  <div key={`preview-${preview}`} className="relative group">
                    <img
                      src={preview}
                      alt="Prévisualisation"
                      className="w-full h-28 object-cover rounded-lg border border-slate-700"
                    />
                    <button
                      className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                      onClick={() => handleRemoveNewProductImage(index)}
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={closeProductModal}>
              Annuler
            </Button>
            <Button onClick={handleSaveProduct}>
              {productModal.editing ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

