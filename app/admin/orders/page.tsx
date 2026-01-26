'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminSidebar from '@/components/AdminSidebar';
import { formatCurrency, formatDate } from '@/lib/utils';
import VirtualBill from '@/components/VirtualBill';

interface BillItem {
  productId: string;
  name: string;
  brand: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
}

interface Bill {
  _id: string;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: BillItem[];
  subtotal: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'pending' | 'partial' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Bill | null>(null);
  const [showBill, setShowBill] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchOrders();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/admin/check');
      if (!response.data.success) {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bills?status=pending');
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        toast.error(response.data.error || 'Failed to fetch orders');
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = (order: Bill) => {
    setSelectedOrder(order);
    setShowBill(true);
  };

  const handleBillSaved = () => {
    setShowBill(false);
    setSelectedOrder(null);
    fetchOrders(); // Refresh the list
  };

  const pendingCount = orders.length;
  const pendingTotal = orders.reduce((sum, order) => sum + order.grandTotal, 0);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Pending Orders</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Orders</h3>
            <p className="text-4xl font-bold text-orange-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Amount</h3>
            <p className="text-4xl font-bold text-blue-600">{formatCurrency(pendingTotal)}</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              <p className="text-lg mb-2">No pending orders</p>
              <p className="text-sm text-gray-500">All orders have been processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.billNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        {order.customerAddress && (
                          <div className="text-sm text-gray-500">{order.customerAddress}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerPhone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(new Date(order.createdAt))}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">{formatCurrency(order.grandTotal)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items.length} items</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleGenerateBill(order)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                        >
                          Generate Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Virtual Bill Modal */}
      {showBill && selectedOrder && (
        <VirtualBill
          bill={selectedOrder}
          onClose={() => {
            setShowBill(false);
            setSelectedOrder(null);
          }}
          onBillSaved={handleBillSaved}
          isAdmin={true}
        />
      )}
    </div>
  );
}
