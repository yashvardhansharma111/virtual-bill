'use client';

import { useRef, useState } from 'react';
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

interface VirtualBillProps {
  cart: CartItem[];
  onClose: () => void;
}

/**
 * Virtual Bill Component
 * Displays traditional Indian shop receipt format with Hindi text
 */
export default function VirtualBill({ cart, onClose }: VirtualBillProps) {
  const billRef = useRef<HTMLDivElement>(null);
  const [billNumber] = useState(() => String(Math.floor(Math.random() * 1000)).padStart(3, '0'));
  const [customerName, setCustomerName] = useState('');
  const [customerVillage, setCustomerVillage] = useState('');

  // Shop details (can be customized)
  const shopName = 'शिव ट्रेडर्स';
  const ownerName = 'प्रो. रवि पोरवाल';
  const shopPhone = 'मो. 9977248057';
  const shopAddress = 'बटलावदी रोड़, बेहलोला, तह. खाचरौद, जि. उज्जैन (म.प्र.)';
  const shopDescription = 'ईलेक्ट्रॉनिक्स & हार्डवेयर';
  const shopInfo = 'हमारे यहाँ लाईट फिटींग, नल फिटींग एवं हार्डवेयर सामग्री उपलब्ध है।';

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = subtotal; // No tax for traditional format

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Use browser's native print-to-PDF functionality
    // This preserves all HTML rendering including Hindi text perfectly
    // User can select "Save as PDF" in the print dialog
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">बिल (Bill Receipt)</h2>
          <div className="flex gap-2">
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
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="ग्राहक का नाम"
                className="border-b border-gray-300 px-2 py-1 outline-none focus:border-purple-600 print:border-none print:px-0"
              />
            </div>
            <div>
              <span className="font-semibold text-gray-800">ग्राम: </span>
              <input
                type="text"
                value={customerVillage}
                onChange={(e) => setCustomerVillage(e.target.value)}
                placeholder="ग्राम/शहर"
                className="border-b border-gray-300 px-2 py-1 outline-none focus:border-purple-600 print:border-none print:px-0"
              />
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
                {cart.map((item, index) => (
                  <tr key={item._id}>
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
                      {formatCurrency(item.price * item.quantity)}
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
