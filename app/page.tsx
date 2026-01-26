'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from '@/components/ProductCard';
import Cart from '@/components/Cart';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCart, setShowCart] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [search, typeFilter, sortBy, sortOrder]);

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (search.length < 2) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await axios.get(`/api/products/suggestions?q=${encodeURIComponent(search)}`);
        if (response.data.success) {
          setSearchSuggestions(response.data.data || []);
          setShowSuggestions(response.data.data && response.data.data.length > 0);
        }
      } catch (error) {
        // Silently fail for suggestions
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 200); // Faster debounce for suggestions

    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleSuggestionClick = (suggestion: string) => {
    setSearch(suggestion);
    setShowSuggestions(false);
    // Trigger product fetch with the selected suggestion
    setTimeout(() => {
      fetchProducts();
    }, 100);
  };

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
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => {
                  if (totalItems === 0) {
                    toast.error('Cart is empty');
                    return;
                  }
                  setShowCustomerForm(true);
                }}
                className="relative bg-purple-600 text-white px-3 sm:px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Cart</span>
                <span className="sm:hidden">🛒</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs">
                    {totalItems}
                  </span>
                )}
              </button>
              <a
                href="/admin/login"
                className="text-gray-600 hover:text-purple-600 transition-colors text-sm sm:text-base px-2 sm:px-0"
              >
                Admin
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Search Bar - Prominent with Suggestions */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products by name, brand, or type..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (searchSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay hiding to allow clicking on suggestions
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg"
            />
            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-purple-50 focus:bg-purple-50 focus:outline-none transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-gray-700">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
          submitting={submitting}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onSubmitOrder={async () => {
            if (cart.length === 0) {
              toast.error('Cart is empty');
              return;
            }
            if (!customerDetails.name.trim() || !customerDetails.phone.trim()) {
              toast.error('Please fill customer details');
              setShowCart(false);
              setShowCustomerForm(true);
              return;
            }

            setSubmitting(true);
            try {
              const items = cart.map((item) => ({
                productId: item._id,
                name: item.name,
                brand: item.brand,
                type: item.type,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity,
              }));

              const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
              const grandTotal = subtotal;

              // Build full address from components
              const addressParts = [
                customerDetails.street,
                customerDetails.city,
                customerDetails.state,
                customerDetails.pincode,
              ].filter(Boolean);
              const fullAddress = addressParts.join(', ');

              const response = await axios.post('/api/bills', {
                billNumber: `BILL-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                customerName: customerDetails.name.trim(),
                customerPhone: customerDetails.phone.trim(),
                customerAddress: fullAddress,
                items,
                subtotal,
                grandTotal,
              });

              if (response.data.success) {
                toast.success('Order submitted successfully! Admin will generate your bill soon.');
                setCart([]);
                setCustomerDetails({ name: '', phone: '', street: '', city: '', state: '', pincode: '' });
                setShowCart(false);
              } else {
                toast.error(response.data.error || 'Failed to submit order');
              }
            } catch (error: any) {
              console.error('Error submitting order:', error);
              toast.error(error.response?.data?.error || 'Failed to submit order');
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )}

      {/* Customer Details Form Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Details</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customerDetails.name.trim()) {
                  toast.error('Please enter customer name');
                  return;
                }
                if (!customerDetails.phone.trim()) {
                  toast.error('Please enter customer phone number');
                  return;
                }
                setShowCustomerForm(false);
                setShowCart(true);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                    placeholder="Enter customer name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customerPhone"
                    type="text"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="customerStreet" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="customerStreet"
                  value={customerDetails.street}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, street: e.target.value })}
                  placeholder="Enter street address, building name, area"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="customerCity" className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customerCity"
                    type="text"
                    value={customerDetails.city}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, city: e.target.value })}
                    placeholder="Enter city"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="customerState" className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customerState"
                    type="text"
                    value={customerDetails.state}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, state: e.target.value })}
                    placeholder="Enter state"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="customerPincode" className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customerPincode"
                    type="text"
                    value={customerDetails.pincode}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, pincode: e.target.value })}
                    placeholder="Enter pincode"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerForm(false);
                    setCustomerDetails({ name: '', phone: '', street: '', city: '', state: '', pincode: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Continue to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
