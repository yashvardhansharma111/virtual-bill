'use client';

import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';

interface Product {
  _id: string;
  name: string;
  type: string;
  price: number;
  brand: string;
  stockQuantity: number;
  image: string;
}

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity?: (id: string, delta: number) => void;
  cartQuantity?: number; // Current quantity in cart
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
  cartQuantity = 0,
  isAdmin = false,
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative h-48 bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          unoptimized
        />
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
          // Show quantity controls if item is in cart
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onUpdateQuantity?.(product._id, -1)}
              className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center font-bold text-lg"
            >
              −
            </button>
            <span className="font-semibold text-lg w-8 text-center">{cartQuantity}</span>
            <button
              onClick={() => onUpdateQuantity?.(product._id, 1)}
              disabled={cartQuantity >= product.stockQuantity}
              className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
