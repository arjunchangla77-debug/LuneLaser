import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, Moon, Sun } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InvoiceView = () => {
  const { tid } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [charge, setCharge] = useState(0);

  // Utility functions
  const parseMinutes = (durationStr) => {
    if (!durationStr) return 0;
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 60 + parts[1];
    if (parts.length === 2) return parts[0];
    const match = durationStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const getCharge = (durationMinutes) => {
    if (durationMinutes >= 4 && durationMinutes < 7) return 10;
    if (durationMinutes >= 7 && durationMinutes < 9) return 20;
    if (durationMinutes >= 9 && durationMinutes < 11) return 30;
    if (durationMinutes >= 11 && durationMinutes < 13) return 40;
    if (durationMinutes >= 13 && durationMinutes <= 15) return 50;
    return 0;
  };

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!tid) {
        setError('No Transaction ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('https://siqolawsbucket.s3.us-east-1.amazonaws.com/Button_details.json');
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        const transaction = data.find(item => String(item.Tid) === tid);
        
        if (transaction) {
          const minutes = parseMinutes(transaction.Duration || '');
          const calculatedCharge = getCharge(minutes);
          setInvoice(transaction);
          setCharge(calculatedCharge);
        } else {
          setError(`No transaction found for TID: ${tid}`);
        }
      } catch (err) {
        setError('Error loading transaction details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [tid]);

  const generatePDF = () => {
    if (!invoice) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(180, 180, 180);
    doc.text('INVOICE', pageWidth / 2, 30, { align: 'center' });

    // Invoice Info Table
    const invoiceNumber = invoice.Tid || '-';
    const invoiceDate = invoice.Date || '-';
    const tableHead = [['INVOICE', 'DATE']];
    const tableData = [[invoiceNumber, invoiceDate]];

    const approxTableWidth = 80;
    const marginLeft = (pageWidth - approxTableWidth) / 2;

    doc.autoTable({
      startY: 40,
      head: tableHead,
      body: tableData,
      theme: 'grid',
      tableWidth: approxTableWidth,
      margin: { left: marginLeft < 10 ? 10 : marginLeft },
      headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: 0, fontSize: 12, halign: 'center' },
      styles: { cellPadding: 2, font: 'helvetica', fontSize: 12, overflow: 'linebreak' }
    });

    // Main Invoice Details Table
    const invoiceData = [
      ['Transaction ID', invoice.Tid || '-'],
      ['Device ID', invoice.Id || '-'],
      ['Time', invoice.Current_time || '-'],
      ['Button', invoice.Btn || '-'],
      ['Duration', invoice.Duration || '-'],
      ['Charge', `$${charge}`]
    ];

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Field', 'Value']],
      body: invoiceData,
      theme: 'grid',
      margin: { left: 25, right: 25 },
      tableWidth: 'auto',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: 50,
        fontSize: 12,
        valign: 'middle'
      },
      styles: {
        cellPadding: 6,
        font: 'helvetica',
        fontSize: 13,
        lineColor: [200, 200, 200],
        lineWidth: 0.4,
        overflow: 'linebreak'
      }
    });

    // Total Box
    let finalY = doc.lastAutoTable.finalY + 12;
    doc.setFillColor(240, 245, 255);
    doc.roundedRect(pageWidth / 2 - 35, finalY - 7, 70, 14, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('TOTAL', pageWidth / 2 - 10, finalY + 3, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`$${charge.toFixed(2)}`, pageWidth / 2 + 30, finalY + 3, { align: 'right' });

    // Thank you note
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text('Thank you for your business!', pageWidth / 2, finalY + 20, { align: 'center' });

    doc.save(`Invoice_${invoice.Tid}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-error text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {/* Theme Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-6 right-6 p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold text-primary">Invoice</h1>
        <div></div>
      </div>

      {/* Invoice Card */}
      <div className="max-w-2xl mx-auto">
        <div className={`card ${darkMode ? 'bg-gray-800 text-white' : ''}`}>
          <div className="text-center mb-8">
            <div className="text-2xl font-bold text-primary mb-2">EnamelPure Invoice</div>
            <div className="text-gray-500">Professional Invoice System</div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="font-semibold text-gray-600">TID:</span>
              <span className="font-medium">{invoice.Tid || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="font-semibold text-gray-600">Device ID:</span>
              <span className="font-medium break-all">{invoice.Id || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="font-semibold text-gray-600">Date:</span>
              <span className="font-medium">{invoice.Date || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="font-semibold text-gray-600">Time:</span>
              <span className="font-medium">{invoice.Current_time || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="font-semibold text-gray-600">Button:</span>
              <span className="font-medium">{invoice.Btn || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="font-semibold text-gray-600">Duration:</span>
              <span className="font-medium">{invoice.Duration || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b-2 border-primary">
              <span className="font-bold text-lg text-primary">Charge:</span>
              <span className="font-bold text-lg text-primary">${charge}</span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={generatePDF}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <Download className="w-5 h-5" />
              <span>Download Invoice (PDF)</span>
            </button>
          </div>

          <div className="mt-6 text-center text-gray-500">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 text-gray-500">
        <p>Designed by humans • for humans</p>
      </div>
    </div>
  );
};

export default InvoiceView;
