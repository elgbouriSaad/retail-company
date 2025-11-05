import React, { useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, Search, Package } from 'lucide-react';
import { mockProducts, categories } from '../../data/mockData';
import { Product } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';

export const CatalogueManagement: React.FC = () => {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'fabrics',
    sizes: '',
    stock: '',
    images: '',
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        sizes: product.sizes.join(', '),
        stock: product.stock.toString(),
        images: product.images.join(', '),
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: 'fabrics',
        sizes: '',
        stock: '',
        images: '',
      });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.price || !productForm.stock) {
      alert('Veuillez remplir tous les champs obligatoires (Nom, Prix, Stock)');
      return;
    }

    const productData = {
      id: editingProduct?.id || Date.now().toString(),
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      category: productForm.category,
      sizes: productForm.sizes.split(',').map(s => s.trim()),
      stock: parseInt(productForm.stock),
      images: productForm.images.split(',').map(s => s.trim()),
      availability: true,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
      alert('Article mis à jour avec succès !');
    } else {
      setProducts(prev => [...prev, productData]);
      alert('Article ajouté avec succès !');
    }

    setShowProductModal(false);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      alert('Article supprimé avec succès !');
    }
  };

  const handleToggleAvailability = (productId: string) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, availability: !product.availability }
        : product
    ));
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, stock: newStock }
        : product
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion du Catalogue</h1>
          <p className="text-slate-400">Gérez votre catalogue de produits</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          Ajouter un Article
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher des articles..."
            value={searchTerm}
            onChange={setSearchTerm}
            icon={Search}
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <div className="text-slate-300 flex items-center">
            <Package className="w-4 h-4 mr-2" />
            {filteredProducts.length} articles
          </div>
        </div>
      </Card>

      {/* Tableau des Articles */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-slate-300 font-medium">Article</th>
                <th className="text-left py-3 text-slate-300 font-medium">Catégorie</th>
                <th className="text-left py-3 text-slate-300 font-medium">Prix</th>
                <th className="text-left py-3 text-slate-300 font-medium">Stock</th>
                <th className="text-left py-3 text-slate-300 font-medium">Statut</th>
                <th className="text-right py-3 text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-slate-700/50">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="text-white font-semibold">{product.name}</p>
                        <p className="text-slate-400 text-sm">{product.description.substring(0, 50)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-slate-300 capitalize">{product.category}</td>
                  <td className="py-4 text-white font-semibold">{product.price.toFixed(2)} DH</td>
                  <td className="py-4 text-slate-300">{product.stock}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      product.availability
                        ? 'text-green-400 bg-green-400/10'
                        : 'text-red-400 bg-red-400/10'
                    }`}>
                      {product.availability ? 'Disponible' : 'Rupture de Stock'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant={product.availability ? "secondary" : "primary"}
                        onClick={() => handleToggleAvailability(product.id)}
                      >
                        {product.availability ? 'Désactiver' : 'Activer'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Edit}
                        onClick={() => handleOpenModal(product)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={Trash2}
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Formulaire Article */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'Modifier l\'Article' : 'Ajouter un Nouvel Article'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nom de l'Article"
            value={productForm.name}
            onChange={(value) => setProductForm(prev => ({ ...prev, name: value }))}
            placeholder="Entrez le nom de l'article"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={productForm.description}
              onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Entrez la description de l'article"
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prix"
              type="number"
              step="0.01"
              value={productForm.price}
              onChange={(value) => setProductForm(prev => ({ ...prev, price: value }))}
              placeholder="0.00"
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Catégorie
              </label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.filter(c => c.id !== 'all').map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tailles (séparées par des virgules)"
              value={productForm.sizes}
              onChange={(value) => setProductForm(prev => ({ ...prev, sizes: value }))}
              placeholder="XS, S, M, L, XL"
            />

            <Input
              label="Quantité en Stock"
              type="number"
              value={productForm.stock}
              onChange={(value) => setProductForm(prev => ({ ...prev, stock: value }))}
              placeholder="0"
              required
            />
          </div>

          <Input
            label="URLs des Images (séparées par des virgules)"
            value={productForm.images}
            onChange={(value) => setProductForm(prev => ({ ...prev, images: value }))}
            placeholder="https://exemple.com/image1.jpg, https://exemple.com/image2.jpg"
          />

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleSaveProduct}>
              {editingProduct ? 'Mettre à Jour' : 'Ajouter l\'Article'}
            </Button>
            <Button variant="secondary" onClick={() => setShowProductModal(false)}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

