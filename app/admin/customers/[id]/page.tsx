'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminSidebar from '@/components/AdminSidebar';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Bill {
  _id: string;
  billNumber: string;
  customerName: string;
  customerVillage: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isVerified: boolean;
  createdAt: string;
}

interface Summary {
  totalBills: number;
  paidBills: number;
  pendingBills: number;
  totalAmount: number;
  totalPaid: number;
  outstandingBalance: number;
}

/**
 * Admin Customer Detail Page
 * View customer details, bills, and outstanding balance
 */
export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSMS, setSendingSMS] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    checkAdminAuth();
    fetchCustomerDetails();
  }, [customerId]);

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

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/customers/${customerId}`);
      if (response.data.success) {
        setCustomer(response.data.customer);
        setBills(response.data.bills || []);
        setSummary(response.data.summary);
      } else {
        toast.error(response.data.error || 'Failed to fetch customer details');
        router.push('/admin/customers');
      }
    } catch (error: any) {
      console.error('Error fetching customer details:', error);
      toast.error('Failed to fetch customer details');
      router.push('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedBill || !paidAmount) return;

    const amount = parseFloat(paidAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setUpdatingPayment(true);
    try {
      const response = await axios.put(`/api/bills/${selectedBill._id}`, {
        paidAmount: amount,
      });

      if (response.data.success) {
        toast.success('Payment updated successfully!');
        setShowPaymentModal(false);
        setPaidAmount('');
        setSelectedBill(null);
        fetchCustomerDetails(); // Refresh data
      } else {
        toast.error(response.data.error || 'Failed to update payment');
      }
    } catch (error: any) {
      console.error('Error updating payment:', error);
      toast.error(error.response?.data?.error || 'Failed to update payment');
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleSendSMS = () => {
    if (!customer) return;
    if (summary && summary.outstandingBalance > 0) {
      setSmsMessage(
        `Dear ${customer.name}, your outstanding balance is ₹${summary.outstandingBalance.toLocaleString('en-IN')}. Please settle at your earliest convenience. Thank you - Virtual Bill`
      );
    }
    setShowSMSModal(true);
  };

  const sendSMS = async () => {
    if (!customer) return;

    if (!smsMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSendingSMS(true);
    try {
      const response = await axios.post('/api/admin/sms/send', {
        userId: customer.id,
        message: smsMessage,
        type: summary && summary.outstandingBalance > 0 ? 'outstanding' : 'custom',
        outstandingAmount: summary?.outstandingBalance || 0,
      });

      if (response.data.success) {
        toast.success('SMS sent successfully!');
        setShowSMSModal(false);
        setSmsMessage('');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading customer details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!customer || !summary) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <button
                onClick={() => router.push('/admin/customers')}
                className="text-purple-600 hover:text-purple-700 mb-4"
              >
                ← Back to Customers
              </button>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{customer.name}</h1>
              <p className="text-gray-600">{customer.email} • {customer.phone}</p>
              {customer.address && <p className="text-gray-600">{customer.address}</p>}
            </div>
            <button
              onClick={handleSendSMS}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Send SMS
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-sm text-gray-600 mb-1">Total Bills</p>
              <p className="text-2xl font-bold text-gray-800">{summary.totalBills}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-sm text-gray-600 mb-1">Paid Bills</p>
              <p className="text-2xl font-bold text-green-600">{summary.paidBills}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-sm text-gray-600 mb-1">Pending Bills</p>
              <p className="text-2xl font-bold text-orange-600">{summary.pendingBills}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.outstandingBalance)}
              </p>
            </div>
          </div>

          {/* Bills Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Bills History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Bill #</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Paid</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Outstanding</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800">{bill.billNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(bill.grandTotal)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-green-600">{formatCurrency(bill.paidAmount)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-semibold ${
                            bill.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {formatCurrency(bill.outstandingAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            bill.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : bill.status === 'partial'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {bill.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {bill.outstandingAmount > 0 && (
                          <button
                            onClick={() => {
                              setSelectedBill(bill);
                              setPaidAmount(bill.paidAmount.toString());
                              setShowPaymentModal(true);
                            }}
                            className="bg-purple-600 text-white px-4 py-1 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                          >
                            Update Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Modal */}
      {showSMSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Send SMS</h2>
              <p className="text-sm text-gray-600 mt-1">
                To: {customer.name} ({customer.phone})
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
                {summary.outstandingBalance > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Outstanding Balance: {formatCurrency(summary.outstandingBalance)}
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

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Update Payment</h2>
              <p className="text-sm text-gray-600 mt-1">Bill: {selectedBill.billNumber}</p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid Amount
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  min="0"
                  max={selectedBill.grandTotal}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                  placeholder="Enter paid amount"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Total: {formatCurrency(selectedBill.grandTotal)} | Outstanding:{' '}
                  {formatCurrency(selectedBill.outstandingAmount)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdatePayment}
                  disabled={updatingPayment || !paidAmount}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {updatingPayment ? 'Updating...' : 'Update Payment'}
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaidAmount('');
                    setSelectedBill(null);
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
