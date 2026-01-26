'use client';

import { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatCurrency, formatDate } from '@/lib/utils';

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

interface VirtualBillProps {
  // Admin mode: pass bill object
  bill?: Bill;
  isAdmin?: boolean;
  onBillSaved?: () => void;
  // Customer mode (legacy): pass cart
  cart?: CartItem[];
  onClose: () => void;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialCustomerAddress?: string;
}

/**
 * Virtual Bill Component
 * Displays traditional Indian shop receipt format with Hindi text
 * Supports both admin mode (with payment management) and customer mode (legacy)
 */
export default function VirtualBill({ 
  bill,
  isAdmin = false,
  onBillSaved,
  cart,
  onClose,
  initialCustomerName = '',
  initialCustomerPhone = '',
  initialCustomerAddress = '',
}: VirtualBillProps) {
  const billRef = useRef<HTMLDivElement>(null);
  
  // Admin mode: use bill data
  const [billNumber, setBillNumber] = useState(bill?.billNumber || `BILL-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
  const [customerName, setCustomerName] = useState(bill?.customerName || initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState(bill?.customerPhone || initialCustomerPhone);
  const [customerAddress, setCustomerAddress] = useState(bill?.customerAddress || initialCustomerAddress);
  const [paidAmount, setPaidAmount] = useState(bill?.paidAmount || 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Update state when bill prop changes
  useEffect(() => {
    if (bill) {
      setBillNumber(bill.billNumber);
      setCustomerName(bill.customerName);
      setCustomerPhone(bill.customerPhone);
      setCustomerAddress(bill.customerAddress);
      setPaidAmount(bill.paidAmount);
    }
  }, [bill]);

  // Update state when initial values change (customer mode)
  useEffect(() => {
    if (!bill) {
      setCustomerName(initialCustomerName);
      setCustomerPhone(initialCustomerPhone);
      setCustomerAddress(initialCustomerAddress);
    }
  }, [initialCustomerName, initialCustomerPhone, initialCustomerAddress, bill]);

  // Shop details (can be customized)
  const shopName = 'शिव ट्रेडर्स';
  const ownerName = 'प्रो. रवि पोरवाल';
  const shopPhone = 'मो. 9977248057';
  const shopAddress = 'बटलावदी रोड़, बेहलोला, तह. खाचरौद, जि. उज्जैन (म.प्र.)';
  const shopDescription = 'ईलेक्ट्रॉनिक्स & हार्डवेयर';
  const shopInfo = 'हमारे यहाँ लाईट फिटींग, नल फिटींग एवं हार्डवेयर सामग्री उपलब्ध है।';

  // Calculate totals
  const items = bill?.items || (cart?.map(item => ({
    productId: item._id,
    name: item.name,
    brand: item.brand,
    type: item.type,
    quantity: item.quantity,
    price: item.price,
    total: item.price * item.quantity,
  })) || []);
  
  const subtotal = bill?.subtotal || (cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0);
  const grandTotal = bill?.grandTotal || subtotal;
  const outstandingAmount = grandTotal - paidAmount;
  const status = outstandingAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleSaveBill = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (!customerPhone.trim()) {
      toast.error('Please enter customer phone number');
      return;
    }

    if (isAdmin && bill) {
      // Admin mode: Update existing bill with payment
      if (paidAmount < 0 || paidAmount > grandTotal) {
        toast.error('Paid amount must be between 0 and total amount');
        return;
      }

      setSaving(true);
      try {
        const response = await axios.put(`/api/bills/${bill._id}`, {
          paidAmount: Number(paidAmount),
        });

        if (response.data.success) {
          setSaved(true);
          toast.success('Bill updated successfully!');
          if (onBillSaved) {
            setTimeout(() => {
              onBillSaved();
            }, 1000);
          }
        } else {
          toast.error(response.data.error || 'Failed to update bill');
        }
      } catch (error: any) {
        console.error('Error updating bill:', error);
        toast.error(error.response?.data?.error || 'Failed to update bill');
      } finally {
        setSaving(false);
      }
    } else if (cart && cart.length > 0) {
      // Customer mode (legacy): Create new bill
      setSaving(true);
      try {
        const billItems = cart.map((item) => ({
          productId: item._id,
          name: item.name,
          brand: item.brand,
          type: item.type,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        }));

        const response = await axios.post('/api/bills', {
          billNumber,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          items: billItems,
          subtotal,
          grandTotal,
        });

        if (response.data.success) {
          setSaved(true);
          toast.success('Bill saved successfully!');
        } else {
          toast.error(response.data.error || 'Failed to save bill');
        }
      } catch (error: any) {
        console.error('Error saving bill:', error);
        toast.error(error.response?.data?.error || 'Failed to save bill');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">बिल (Bill Receipt)</h2>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                {!saved && (
                  <button
                    onClick={handleSaveBill}
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Update Payment'}
                  </button>
                )}
                {saved && (
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold">
                    ✓ Updated
                  </span>
                )}
              </>
            )}
            {!isAdmin && (
              <>
                {!saved && (
                  <button
                    onClick={handleSaveBill}
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Bill'}
                  </button>
                )}
                {saved && (
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold">
                    ✓ Saved
                  </span>
                )}
              </>
            )}
            <button
              onClick={handleDownloadPDF}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              PDF डाउनलोड
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              प्रिंट
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Bill Content */}
        <div ref={billRef} id="bill-content" className="p-8 print:p-4 bg-white">
          {/* Shop Header */}
          <div className="text-center mb-6 border-b-2 border-blue-600 pb-4">
            <h1 className="text-4xl font-bold text-red-600 mb-2">{shopName}</h1>
            <p className="text-lg text-gray-800 mb-1">{ownerName}</p>
            <p className="text-base text-gray-700 mb-1">{shopPhone}</p>
            <p className="text-base text-gray-700 mb-2">{shopDescription}</p>
            <p className="text-sm text-gray-600 mb-2">{shopInfo}</p>
            <p className="text-sm text-gray-600">{shopAddress}</p>
          </div>

          {/* Bill Number and Date */}
          <div className="flex justify-between mb-4">
            <div>
              <span className="font-semibold text-gray-800">क्र. </span>
              <span className="text-gray-700">{billNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-800">दिनांक: </span>
              <span className="text-gray-700">{new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mb-4 space-y-2">
            <div>
              <span className="font-semibold text-gray-800">श्रीमान: </span>
              {isAdmin ? (
                <span className="text-gray-700">{customerName}</span>
              ) : (
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="ग्राहक का नाम"
                  className="border-b border-gray-300 px-2 py-1 outline-none focus:border-purple-600 print:border-none print:px-0"
                  required
                />
              )}
            </div>
            <div>
              <span className="font-semibold text-gray-800">फोन: </span>
              {isAdmin ? (
                <span className="text-gray-700">{customerPhone}</span>
              ) : (
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="फोन नंबर"
                  className="border-b border-gray-300 px-2 py-1 outline-none focus:border-purple-600 print:border-none print:px-0"
                  required
                />
              )}
            </div>
            <div>
              <span className="font-semibold text-gray-800">ग्राम/पता: </span>
              {isAdmin ? (
                <span className="text-gray-700">{customerAddress || 'N/A'}</span>
              ) : (
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="ग्राम/शहर/पता"
                  className="border-b border-gray-300 px-2 py-1 outline-none focus:border-purple-600 print:border-none print:px-0"
                />
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-gray-800">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border border-gray-800 px-2 py-2 text-center text-sm font-bold">क्र.</th>
                  <th className="border border-gray-800 px-2 py-2 text-left text-sm font-bold">विवरण</th>
                  <th className="border border-gray-800 px-2 py-2 text-center text-sm font-bold">नग</th>
                  <th className="border border-gray-800 px-2 py-2 text-center text-sm font-bold">भाव</th>
                  <th className="border border-gray-800 px-2 py-2 text-center text-sm font-bold">रकम</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.productId || index}>
                    <td className="border border-gray-800 px-2 py-2 text-center text-sm">{index + 1}</td>
                    <td className="border border-gray-800 px-2 py-2 text-sm">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-gray-600">{item.brand} - {item.type}</p>
                      </div>
                    </td>
                    <td className="border border-gray-800 px-2 py-2 text-center text-sm">{item.quantity}</td>
                    <td className="border border-gray-800 px-2 py-2 text-center text-sm">{formatCurrency(item.price)}</td>
                    <td className="border border-gray-800 px-2 py-2 text-center text-sm font-semibold">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td colSpan={4} className="border border-gray-800 px-2 py-2 text-center font-bold">टोटल</td>
                  <td className="border border-gray-800 px-2 py-2 text-center font-bold text-lg">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Details (Admin Mode) */}
          {isAdmin && (
            <div className="mb-6 border-t-2 border-gray-300 pt-4">
              <h3 className="font-bold text-gray-800 mb-3">भुगतान विवरण (Payment Details)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">कुल राशि (Total Amount):</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">भुगतान राशि (Paid Amount):</span>
                  <div className="flex items-center gap-2">
                    {!saved && (
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => {
                          const value = Math.max(0, Math.min(grandTotal, Number(e.target.value) || 0));
                          setPaidAmount(value);
                        }}
                        min="0"
                        max={grandTotal}
                        step="0.01"
                        className="w-32 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-right font-semibold"
                      />
                    )}
                    {saved && (
                      <span className="text-lg font-bold text-green-600">{formatCurrency(paidAmount)}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">शेष राशि (Outstanding):</span>
                  <span className={`text-lg font-bold ${outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(outstandingAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">स्थिति (Status):</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    status === 'paid' ? 'bg-green-100 text-green-800' :
                    status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {status === 'paid' ? 'पूर्ण भुगतान (Paid)' :
                     status === 'partial' ? 'आंशिक भुगतान (Partial)' :
                     'लंबित (Pending)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="mb-6 border-t-2 border-gray-300 pt-4">
            <h3 className="font-bold text-gray-800 mb-3">हमारी शर्तें -</h3>
            <ol className="space-y-1 text-sm text-gray-700 list-decimal list-inside">
              <li>हम विक्रेता है, निर्माता नही।</li>
              <li>बेंचा हुआ माल वापस नहीं होगा।</li>
              <li>बिल पर हस्ताक्षर लेना या ना लेना हमारी मर्जी पर होगा।</li>
              <li>सभी विवादों का न्यायक्षेत्र खाचरौद रहेगा।</li>
              <li>भूल-चूक, लेनी-देनी।</li>
              <li>मैर्ने उपरोक्त नियम व शर्तों के अनुसार माल लेना स्वीकार किया है।</li>
              <li>रुपया देकर हमारी रसीद प्राप्त करें।</li>
            </ol>
          </div>

          {/* Signatures */}
          <div className="flex justify-between mt-8 pt-4 border-t-2 border-gray-300">
            <div>
              <p className="font-semibold text-gray-800 mb-2">ग्राहक हस्ताक्षर</p>
              <div className="border-b border-gray-400 w-48 h-12"></div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800 mb-2">फॉर {shopName}</p>
              <div className="border-b border-gray-400 w-48 h-12"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles - Optimized for PDF generation */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          #bill-content,
          #bill-content * {
            visibility: visible;
          }
          
          #bill-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 20px;
            margin: 0;
          }
          
          button {
            display: none !important;
          }
          
          input {
            border: none !important;
            border-bottom: 1px solid #000 !important;
            background: transparent !important;
            padding: 2px 4px !important;
            color: #000 !important;
          }
          
          /* Ensure Hindi fonts render correctly */
          * {
            font-family: Arial, "Noto Sans Devanagari", "Mangal", sans-serif !important;
          }
          
          /* Hide scrollbars */
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
