'use client';

import { useState, useEffect, useRef } from 'react';
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

interface CartItem extends Product {
  quantity: number;
}

interface CartProps {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity?: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onSubmitOrder: () => void;
  submitting?: boolean;
}

/**
 * Cart Component
 * Displays cart items with quantity controls
 */
export default function Cart({
  cart,
  onClose,
  onUpdateQuantity,
  onSetQuantity,
  onRemove,
  onSubmitOrder,
  submitting = false,
}: CartProps) {
  const [displayQtys, setDisplayQtys] = useState<Record<string, string>>({});
  const focusedId = useRef<string | null>(null);

  useEffect(() => {
    setDisplayQtys((prev) => {
      const next: Record<string, string> = {};
      cart.forEach((item) => {
        next[item._id] = focusedId.current === item._id
          ? (prev[item._id] ?? String(item.quantity))
          : String(item.quantity);
      });
      return next;
    });
  }, [cart]);

  const commitQuantity = (id: string, raw: string, max: number) => {
    focusedId.current = null;
    const v = raw.trim();
    if (v === '') {
      onSetQuantity?.(id, 1);
      setDisplayQtys((p) => ({ ...p, [id]: '1' }));
      return;
    }
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 1) {
      onSetQuantity?.(id, 1);
      setDisplayQtys((p) => ({ ...p, [id]: '1' }));
      return;
    }
    const clamped = Math.min(n, max);
    onSetQuantity?.(id, clamped);
    setDisplayQtys((p) => ({ ...p, [id]: String(clamped) }));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full sm:max-w-md h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">Your cart is empty</p>
              <button
                onClick={onClose}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div
                    key={item._id}
                    className="bg-gray-50 rounded-lg p-4 flex gap-4"
                  >
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.brand}</p>
                      <p className="text-purple-600 font-bold mb-2">
                        {formatCurrency(item.price)}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onUpdateQuantity(item._id, -1)}
                          className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center shrink-0"
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={item.stockQuantity}
                          value={displayQtys[item._id] ?? item.quantity}
                          onChange={(e) => {
                            focusedId.current = item._id;
                            setDisplayQtys((p) => ({ ...p, [item._id]: e.target.value }));
                          }}
                          onFocus={() => { focusedId.current = item._id; }}
                          onBlur={(e) => commitQuantity(item._id, e.target.value, item.stockQuantity)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          }}
                          className="w-12 h-8 text-center font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => onUpdateQuantity(item._id, 1)}
                          disabled={item.quantity >= item.stockQuantity}
                          className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Increase"
                        >
                          +
                        </button>
                        <button
                          onClick={() => onRemove(item._id)}
                          className="ml-auto text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <button
                onClick={onSubmitOrder}
                disabled={submitting}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Order'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
