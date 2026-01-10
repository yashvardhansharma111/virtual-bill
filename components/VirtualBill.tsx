'use client';

import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
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

  const handleDownloadPDF = async () => {
    if (!billRef.current) return;

    const pdf = new jsPDF({
      unit: 'mm',
      format: [80, 297], // A4 width, longer height for receipt
    });

    let yPos = 10;

    // Shop Header
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(shopName, 40, yPos, { align: 'center' });
    yPos += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(ownerName, 40, yPos, { align: 'center' });
    yPos += 4;
    pdf.text(shopPhone, 40, yPos, { align: 'center' });
    yPos += 4;
    pdf.text(shopDescription, 40, yPos, { align: 'center' });
    yPos += 4;
    pdf.text(shopInfo, 40, yPos, { align: 'center' });
    yPos += 4;
    pdf.text(shopAddress, 40, yPos, { align: 'center' });
    yPos += 6;

    // Bill Number and Date
    pdf.setFontSize(9);
    pdf.text(`क्र. ${billNumber}`, 5, yPos);
    pdf.text(`दिनांक: ${new Date().toLocaleDateString('en-IN')}`, 50, yPos, { align: 'right' });
    yPos += 5;

    // Customer Details
    pdf.text(`श्रीमान: ${customerName || '________________'}`, 5, yPos);
    yPos += 4;
    pdf.text(`ग्राम: ${customerVillage || '________________'}`, 5, yPos);
    yPos += 5;

    // Table Header
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('क्र.', 5, yPos);
    pdf.text('विवरण', 12, yPos);
    pdf.text('नग', 50, yPos);
    pdf.text('भाव', 58, yPos);
    pdf.text('रकम', 70, yPos, { align: 'right' });
    yPos += 4;
    pdf.line(5, yPos, 75, yPos);
    yPos += 3;

    // Items
    pdf.setFont('helvetica', 'normal');
    cart.forEach((item, index) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 10;
      }
      pdf.text(String(index + 1), 5, yPos);
      const itemDesc = `${item.name} (${item.brand})`;
      pdf.text(itemDesc.length > 30 ? itemDesc.substring(0, 27) + '...' : itemDesc, 12, yPos);
      pdf.text(String(item.quantity), 50, yPos);
      pdf.text(formatCurrency(item.price), 58, yPos);
      pdf.text(formatCurrency(item.price * item.quantity), 70, yPos, { align: 'right' });
      yPos += 5;
    });

    // Total
    yPos += 2;
    pdf.line(5, yPos, 75, yPos);
    yPos += 3;
    pdf.setFont('helvetica', 'bold');
    pdf.text('टोटल', 5, yPos);
    pdf.text(formatCurrency(grandTotal), 70, yPos, { align: 'right' });
    yPos += 8;

    // Terms and Conditions
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('हमारी शर्तें -', 5, yPos);
    yPos += 4;
    pdf.setFont('helvetica', 'normal');
    const terms = [
      '(1) हम विक्रेता है, निर्माता नही।',
      '(2) बेंचा हुआ माल वापस नहीं होगा।',
      '(3) बिल पर हस्ताक्षर लेना या ना लेना हमारी मर्जी पर होगा।',
      '(4) सभी विवादों का न्यायक्षेत्र खाचरौद रहेगा।',
      '(5) भूल-चूक, लेनी-देनी।',
      '(6) मैर्ने उपरोक्त नियम व शर्तों के अनुसार माल लेना स्वीकार किया है।',
      '(7) रुपया देकर हमारी रसीद प्राप्त करें।',
    ];

    terms.forEach((term) => {
      if (yPos > 280) {
        pdf.addPage();
        yPos = 10;
      }
      pdf.text(term, 5, yPos);
      yPos += 4;
    });

    // Signatures
    yPos += 5;
    pdf.text('ग्राहक हस्ताक्षर', 5, yPos);
    pdf.text('फॉर ' + shopName, 50, yPos, { align: 'right' });

    pdf.save(`bill-${billNumber}-${Date.now()}.pdf`);
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
        <div ref={billRef} className="p-8 print:p-4 bg-white">
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

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-4,
          .print\\:p-4 * {
            visibility: visible;
          }
          .print\\:p-4 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          button {
            display: none !important;
          }
          input {
            border: none !important;
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  );
}
