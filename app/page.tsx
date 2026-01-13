'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from '@/components/ProductCard';
import Cart from '@/components/Cart';
import VirtualBill from '@/components/VirtualBill';
import AuthPopup from '@/components/AuthPopup';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  _id: string;
  name: string;
  type: string;
  price: number;
  brand: string;
  stockQuantity: number;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

/**
 * User Panel - Home Page
 * Product listing with cart functionality
 */
export default function Home() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCart, setShowCart] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [search, typeFilter, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await axios.get(`/api/products?${params.toString()}`);
      
      // Handle response - always ensure we have an array
      if (response.data.success) {
        setProducts(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setProducts([]);
        if (response.data.error) {
          toast.error(response.data.error);
        }
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setProducts([]); // Set empty array on error
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Failed to fetch products. Please check your database connection.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item._id === product._id);

    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        toast.error('Maximum stock available reached');
        return;
      }
      setCart(
        cart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success('Product added to cart');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item._id === id) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) {
              // Remove from cart if quantity becomes 0
              return null;
            }
            if (newQuantity > item.stockQuantity) {
              toast.error('Maximum stock available reached');
              return item;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item._id !== id));
    toast.success('Product removed from cart');
  };

  const types = Array.from(new Set(products.map((p) => p.type)));

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-purple-600">Virtual Bill</h1>
              <p className="text-sm text-gray-600">Electrical Shop</p>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <a
                    href="/profile"
                    className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    {user.name || user.email}
                  </a>
                  <button
                    onClick={logout}
                    className="text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <a
                  href="/auth/login"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Login
                </a>
              )}
              <button
                onClick={() => setShowCart(true)}
                className="relative bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Cart
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
              <a
                href="/admin/login"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                Admin
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="asc">Low to High</option>
              <option value="desc">High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const cartItem = cart.find((item) => item._id === product._id);
              return (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={addToCart}
                  onUpdateQuantity={updateQuantity}
                  cartQuantity={cartItem?.quantity || 0}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      {showCart && (
        <Cart
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onGenerateBill={() => {
            if (cart.length === 0) {
              toast.error('Cart is empty');
              return;
            }
            // Check if user is authenticated
            if (!user) {
              setShowAuthPopup(true);
              setShowCart(false);
              return;
            }
            setShowCart(false);
            setShowBill(true);
          }}
        />
      )}

      {/* Virtual Bill */}
      {showBill && (
        <VirtualBill
          cart={cart}
          onClose={() => setShowBill(false)}
        />
      )}

      {/* Auth Popup */}
      {showAuthPopup && (
        <AuthPopup
          onClose={() => setShowAuthPopup(false)}
          onSuccess={() => {
            setShowAuthPopup(false);
            if (cart.length > 0) {
              setShowBill(true);
            }
          }}
        />
      )}
    </div>
  );
}
