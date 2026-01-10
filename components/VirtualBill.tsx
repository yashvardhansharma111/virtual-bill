'use client';

import { useRef, useState } from 'react';
import axios from 'axios';
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

    try {
      // Hide buttons and input borders for PDF capture
      const buttons = billRef.current.querySelectorAll('button');
      const inputs = billRef.current.querySelectorAll('input');
      buttons.forEach((btn) => ((btn as HTMLElement).style.display = 'none'));
      inputs.forEach((input) => {
        (input as HTMLElement).style.border = 'none';
        (input as HTMLElement).style.borderBottom = '1px solid #000';
        (input as HTMLElement).style.backgroundColor = 'transparent';
      });

      // Pre-process colors to avoid lab() parsing errors
      // Add inline styles to override Tailwind classes with hex colors
      const billContent = billRef.current.querySelector('#bill-content');
      if (billContent) {
        const allElements = billContent.querySelectorAll('*');
        allElements.forEach((el: Element) => {
          const htmlEl = el as HTMLElement;
          const classList = htmlEl.classList;
          
          // Set inline styles to override Tailwind classes
          if (classList.contains('bg-purple-600')) {
            htmlEl.style.setProperty('background-color', '#9333ea', 'important');
          } else if (classList.contains('bg-blue-50')) {
            htmlEl.style.setProperty('background-color', '#eff6ff', 'important');
          } else if (classList.contains('bg-gray-100')) {
            htmlEl.style.setProperty('background-color', '#f3f4f6', 'important');
          }
          
          if (classList.contains('text-purple-600')) {
            htmlEl.style.setProperty('color', '#9333ea', 'important');
          } else if (classList.contains('text-gray-800')) {
            htmlEl.style.setProperty('color', '#1f2937', 'important');
          } else if (classList.contains('text-gray-700')) {
            htmlEl.style.setProperty('color', '#374151', 'important');
          } else if (classList.contains('text-gray-600')) {
            htmlEl.style.setProperty('color', '#4b5563', 'important');
          }
          
          if (classList.contains('border-purple-600')) {
            htmlEl.style.setProperty('border-color', '#9333ea', 'important');
          } else if (classList.contains('border-blue-600')) {
            htmlEl.style.setProperty('border-color', '#2563eb', 'important');
          } else if (classList.contains('border-gray-800')) {
            htmlEl.style.setProperty('border-color', '#1f2937', 'important');
          } else if (classList.contains('border-gray-300')) {
            htmlEl.style.setProperty('border-color', '#d1d5db', 'important');
          }
        });
      }

      // Use Puppeteer API instead of html2canvas to avoid lab() color issues
      // Get HTML content
      const htmlContent = billRef.current.outerHTML;
      
      // Restore buttons and inputs first
      buttons.forEach((btn) => ((btn as HTMLElement).style.display = ''));
      inputs.forEach((input) => {
        (input as HTMLElement).style.border = '';
        (input as HTMLElement).style.borderBottom = '';
        (input as HTMLElement).style.backgroundColor = '';
      });

      // Send to server-side Puppeteer API
      const response = await axios.post(
        '/api/bill/pdf',
        { html: htmlContent },
        { responseType: 'blob' }
      );

      // Download PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bill-${billNumber}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return;

      // OLD CODE BELOW - NOT USED
      const canvas = await html2canvas(billRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: billRef.current.scrollWidth,
        height: billRef.current.scrollHeight,
        ignoreElements: (element) => {
          // Ignore elements that might cause issues
          return element.classList?.contains('no-pdf') || false;
        },
        onclone: (clonedDoc) => {
          // Fix color issues - html2canvas doesn't support lab() color functions from Tailwind v4
          const clonedElement = clonedDoc.querySelector('#bill-content') || clonedDoc.body;
          if (clonedElement) {
            // Convert all elements to use simple hex/rgb colors
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement;
              try {
                // Use class-based color mapping instead of computed styles
                // This avoids parsing lab() colors
                if (htmlEl.classList.contains('bg-purple-600')) {
                  htmlEl.style.backgroundColor = '#9333ea';
                } else if (htmlEl.classList.contains('bg-blue-50')) {
                  htmlEl.style.backgroundColor = '#eff6ff';
                } else if (htmlEl.classList.contains('bg-gray-100')) {
                  htmlEl.style.backgroundColor = '#f3f4f6';
                } else if (htmlEl.classList.contains('bg-red-600')) {
                  htmlEl.style.backgroundColor = '#dc2626';
                }
                
                if (htmlEl.classList.contains('text-purple-600')) {
                  htmlEl.style.color = '#9333ea';
                } else if (htmlEl.classList.contains('text-red-600')) {
                  htmlEl.style.color = '#dc2626';
                } else if (htmlEl.classList.contains('text-gray-800')) {
                  htmlEl.style.color = '#1f2937';
                } else if (htmlEl.classList.contains('text-gray-700')) {
                  htmlEl.style.color = '#374151';
                } else if (htmlEl.classList.contains('text-gray-600')) {
                  htmlEl.style.color = '#4b5563';
                }
                
                if (htmlEl.classList.contains('border-purple-600')) {
                  htmlEl.style.borderColor = '#9333ea';
                } else if (htmlEl.classList.contains('border-blue-600')) {
                  htmlEl.style.borderColor = '#2563eb';
                } else if (htmlEl.classList.contains('border-gray-800')) {
                  htmlEl.style.borderColor = '#1f2937';
                } else if (htmlEl.classList.contains('border-gray-300')) {
                  htmlEl.style.borderColor = '#d1d5db';
                }
              } catch (e) {
                // Ignore errors for individual elements
              }
            });
          }
        },
      });

      // Restore buttons and inputs
      buttons.forEach((btn) => ((btn as HTMLElement).style.display = ''));
      inputs.forEach((input) => {
        (input as HTMLElement).style.border = '';
        (input as HTMLElement).style.borderBottom = '';
        (input as HTMLElement).style.backgroundColor = '';
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // If content is taller than one page, add additional pages
      const pageHeight = pdf.internal.pageSize.height;
      let heightLeft = imgHeight;
      let position = 0;

      while (heightLeft > 0) {
        position = heightLeft - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`bill-${billNumber}-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again or use the Print option instead.');
    }
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
