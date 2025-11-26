import React, { useState, useEffect } from 'react';
import { Search, Filter, Star } from 'lucide-react';
import { Product } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { fetchProducts } from '../../utils/productService';

// Product categories
const categories = [
  { id: 'all', name: 'Tous les Articles' },
  { id: 'FABRICS', name: 'Tissus' },
  { id: 'CLOTHES', name: 'Vêtements' },
  { id: 'KITS', name: 'Kits de Couture' },
  { id: 'THREADS', name: 'Fils' },
  { id: 'ACCESSORIES', name: 'Accessoires' },
];

export const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

  // Load products from database
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;
    
    return matchesSearch && matchesCategory && matchesPrice && product.availability;
  });

  const handleViewDetails = (product: Product) => {
    alert(`Product: ${product.name}\nPrice: ${product.price} DH\nDescription: ${product.description}\n\nContact admin to place an order.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Shop</h1>
        <p className="text-slate-400">Discover our premium sewing products and materials</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search products..."
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

          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min price"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max price"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button variant="secondary" icon={Filter}>
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="group hover:ring-2 hover:ring-blue-500 transition-all duration-200">
            <div className="aspect-square bg-slate-700 rounded-lg mb-4 overflow-hidden">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                {product.name}
              </h3>
              
              <p className="text-slate-400 text-sm line-clamp-2">
                {product.description}
              </p>

              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-slate-400 text-sm">(4.5)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-white">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-slate-400 text-sm">
                  Stock: {product.stock}
                </span>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewDetails(product)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-slate-400 text-lg">No products found matching your criteria</p>
          <p className="text-slate-500 mt-2">Try adjusting your filters or search terms</p>
        </Card>
      )}
    </div>
  );
};