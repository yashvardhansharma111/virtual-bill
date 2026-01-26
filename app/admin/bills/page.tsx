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

export default function AdminBillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showBill, setShowBill] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchBills();
  }, [statusFilter]);

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

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) {
        // Try searching by phone first, then by name
        if (/^\d+$/.test(search)) {
          params.append('customerPhone', search);
        } else {
          params.append('customerName', search);
        }
      }

      const response = await axios.get(`/api/bills?${params.toString()}`);
      if (response.data.success) {
        setBills(response.data.data || []);
      } else {
        toast.error(response.data.error || 'Failed to fetch bills');
      }
    } catch (error: any) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchBills();
  };

  const totalBills = bills.length;
  const totalAmount = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
  const totalOutstanding = bills.reduce((sum, bill) => sum + bill.outstandingAmount, 0);
  const totalPaid = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full lg:ml-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">All Bills</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Total Bills</h3>
            <p className="text-2xl sm:text-4xl font-bold text-purple-600">{totalBills}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Total Amount</h3>
            <p className="text-xl sm:text-2xl lg:text-4xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Outstanding</h3>
            <p className="text-xl sm:text-2xl lg:text-4xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Paid</h3>
            <p className="text-xl sm:text-2xl lg:text-4xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
        </div>

        {/* Search Bar - Prominent */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by customer name or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
            <button
              onClick={handleSearch}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-4 sm:p-6 text-center text-gray-600">Loading bills...</div>
          ) : bills.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-600">No bills found.</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.billNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{bill.customerName}</div>
                        {bill.customerAddress && (
                          <div className="text-sm text-gray-500">{bill.customerAddress}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.customerPhone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(new Date(bill.createdAt))}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(bill.grandTotal)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(bill.paidAmount)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${bill.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(bill.outstandingAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                          bill.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setShowBill(true);
                          }}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                        >
                          View/Edit Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              
              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-200">
                {bills.map((bill) => (
                  <div key={bill._id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{bill.billNumber}</p>
                        <p className="text-sm text-gray-600">{bill.customerName}</p>
                        {bill.customerAddress && (
                          <p className="text-xs text-gray-500 mt-1">{bill.customerAddress}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                        bill.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="font-medium">{bill.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-medium">{formatDate(new Date(bill.createdAt))}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-medium">{formatCurrency(bill.grandTotal)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Paid</p>
                        <p className="font-medium">{formatCurrency(bill.paidAmount)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500">Outstanding</p>
                        <p className={`font-semibold ${bill.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(bill.outstandingAmount)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBill(bill);
                        setShowBill(true);
                      }}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm"
                    >
                      View/Edit Bill
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Virtual Bill Modal */}
      {showBill && selectedBill && (
        <VirtualBill
          bill={selectedBill}
          isAdmin={true}
          onClose={() => {
            setShowBill(false);
            setSelectedBill(null);
            fetchBills(); // Refresh the list
          }}
          onBillSaved={() => {
            setShowBill(false);
            setSelectedBill(null);
            fetchBills(); // Refresh the list
          }}
        />
      )}
    </div>
  );
}
