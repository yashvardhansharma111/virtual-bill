'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';

interface Product {
  _id: string;
  name: string;
  type: string;
  price: number;
  brand: string;
  stockQuantity: number;
  image?: string;
}

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity?: (id: string, delta: number) => void;
  onSetQuantity?: (id: string, quantity: number) => void;
  cartQuantity?: number;
  isAdmin?: boolean;
}

/**
 * Product Card Component
 * Displays product information with admin/user actions
 */
export default function ProductCard({
  product,
  onEdit,
  onDelete,
  onAddToCart,
  onUpdateQuantity,
  onSetQuantity,
  cartQuantity = 0,
  isAdmin = false,
}: ProductCardProps) {
  const [displayQty, setDisplayQty] = useState(String(cartQuantity));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setDisplayQty(String(cartQuantity));
  }, [cartQuantity]);

  const commitQuantity = (raw: string) => {
    const v = raw.trim();
    if (v === '') {
      onSetQuantity?.(product._id, 1);
      setDisplayQty('1');
      return;
    }
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 1) {
      onSetQuantity?.(product._id, 1);
      setDisplayQty('1');
      return;
    }
    const clamped = Math.min(n, product.stockQuantity);
    onSetQuantity?.(product._id, clamped);
    setDisplayQty(String(clamped));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative h-48 bg-gray-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <span className="text-4xl font-light text-gray-300">No image</span>
          </div>
        )}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="mb-2">
          <h3 className="text-xl font-bold text-gray-800 mb-1">{product.name}</h3>
          <p className="text-sm text-gray-600">Brand: {product.brand}</p>
          <p className="text-sm text-purple-600 font-medium">{product.type}</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(product.price)}</p>
            <p className="text-sm text-gray-500">Stock: {product.stockQuantity}</p>
          </div>
        </div>

        {isAdmin ? (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(product)}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(product._id)}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        ) : cartQuantity > 0 ? (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onUpdateQuantity?.(product._id, -1)}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center font-bold text-lg"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={product.stockQuantity}
              value={displayQty}
              onChange={(e) => {
                isFocused.current = true;
                setDisplayQty(e.target.value);
              }}
              onFocus={() => { isFocused.current = true; }}
              onBlur={(e) => {
                isFocused.current = false;
                commitQuantity(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-12 sm:w-14 h-9 sm:h-10 text-center font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => onUpdateQuantity?.(product._id, 1)}
              disabled={cartQuantity >= product.stockQuantity}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={() => onAddToCart?.(product)}
            disabled={product.stockQuantity === 0}
            className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
