'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminSidebar from '@/components/AdminSidebar';
import { formatCurrency } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isVerified: boolean;
  totalBills: number;
  paidBills: number;
  pendingBills: number;
  outstandingBalance: number;
  createdAt: string;
}

/**
 * Admin Customers Page
 * View all customers with outstanding balances
 */
export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSMS, setSendingSMS] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchCustomers();
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [search]);

  const checkAdminAuth = async () => {
    try {
      const response = await axios.get('/api/admin/check');
      if (!response.data.success || !response.data.authenticated) {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await axios.get(`/api/admin/customers?${params.toString()}`);
      if (response.data.success) {
        setCustomers(response.data.data || []);
      } else {
        toast.error(response.data.error || 'Failed to fetch customers');
        setCustomers([]);
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = async (customer: Customer, customMessage?: string) => {
    setSelectedCustomer(customer);
    if (customer.outstandingBalance > 0) {
      // Auto-generate outstanding balance message
      setSmsMessage(
        customMessage ||
          `Dear ${customer.name}, your outstanding balance is ₹${customer.outstandingBalance.toLocaleString('en-IN')}. Please settle at your earliest convenience. Thank you - Virtual Bill`
      );
    } else {
      setSmsMessage(customMessage || '');
    }
    setShowSMSModal(true);
  };

  const sendSMS = async () => {
    if (!selectedCustomer) return;

    if (!smsMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSendingSMS(true);
    try {
      const response = await axios.post('/api/admin/sms/send', {
        userId: selectedCustomer.id,
        message: smsMessage,
        type: selectedCustomer.outstandingBalance > 0 ? 'outstanding' : 'custom',
        outstandingAmount: selectedCustomer.outstandingBalance,
      });

      if (response.data.success) {
        toast.success('SMS sent successfully!');
        setShowSMSModal(false);
        setSmsMessage('');
        setSelectedCustomer(null);
      } else {
        toast.error(response.data.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      toast.error(error.response?.data?.error || 'Failed to send SMS');
    } finally {
      setSendingSMS(false);
    }
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const customersWithBalance = customers.filter((c) => c.outstandingBalance > 0).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Customers</h1>
            <p className="text-gray-600">Manage customers and outstanding balances</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-800">{customers.length}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">With Outstanding</p>
                  <p className="text-3xl font-bold text-purple-600">{customersWithBalance}</p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Outstanding</p>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(totalOutstanding)}
                  </p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
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
                placeholder="Search by customer name, email, or phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-lg"
              />
            </div>
          </div>

          {/* Customers Table */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <p className="text-gray-600 text-lg">No customers found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Total Bills</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Pending</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Outstanding</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-800">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{customer.phone}</p>
                          {customer.address && (
                            <p className="text-xs text-gray-500 mt-1">{customer.address}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-700">{customer.totalBills}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-orange-600 font-semibold">
                            {customer.pendingBills}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`text-sm font-bold ${
                              customer.outstandingBalance > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {formatCurrency(customer.outstandingBalance)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => router.push(`/admin/customers/${customer.id}`)}
                              className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleSendSMS(customer)}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                            >
                              SMS
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SMS Modal */}
      {showSMSModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Send SMS</h2>
              <p className="text-sm text-gray-600 mt-1">
                To: {selectedCustomer.name} ({selectedCustomer.phone})
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                  placeholder="Enter your message..."
                />
                {selectedCustomer.outstandingBalance > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Outstanding Balance: {formatCurrency(selectedCustomer.outstandingBalance)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={sendSMS}
                  disabled={sendingSMS || !smsMessage.trim()}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {sendingSMS ? 'Sending...' : 'Send SMS'}
                </button>
                <button
                  onClick={() => {
                    setShowSMSModal(false);
                    setSmsMessage('');
                    setSelectedCustomer(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
