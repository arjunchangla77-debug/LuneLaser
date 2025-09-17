import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Download, FileText, Calendar, Clock, DollarSign, User, Activity, Moon, Sun } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InvoiceDetail = () => {
  const { tid } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Utility functions
  const parseMinutes = React.useCallback((durationStr) => {
    if (!durationStr) return 0;
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 60 + parts[1];
    if (parts.length === 2) return parts[0];
    const match = durationStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }, []);

  const getCharge = React.useCallback((durationMinutes) => {
    if (durationMinutes >= 4 && durationMinutes < 7) return 10;
    if (durationMinutes >= 7 && durationMinutes < 9) return 20;
    if (durationMinutes >= 9 && durationMinutes < 11) return 30;
    if (durationMinutes >= 11 && durationMinutes < 13) return 40;
    if (durationMinutes >= 13 && durationMinutes <= 15) return 50;
    return 0;
  }, []);

  const loadInvoiceDetail = React.useCallback(async () => {
    setLoading(true);
    setMessage('Loading invoice details...');
    try {
      const response = await fetch('https://siqolawsbucket.s3.us-east-1.amazonaws.com/Button_details.json');
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      const invoice = data.find(item => item.Tid === tid);
      
      if (invoice) {
        const processedInvoice = {
          tid: invoice.Tid || '-',
          id: invoice.Id || '-',
          date: invoice.Date || '-',
          time: invoice.Current_time || '-',
          action: invoice.Btn || '-',
          duration: invoice.Duration || '-',
          charge: getCharge(parseMinutes(invoice.Duration || ''))
        };
        setInvoiceData(processedInvoice);
        setMessage('');
      } else {
        setMessage('Invoice not found');
      }
    } catch (error) {
      setMessage('Error loading invoice details. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [tid, getCharge, parseMinutes]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      loadInvoiceDetail();
    }
  }, [isAuthenticated, navigate, loadInvoiceDetail]);

  const generateInvoicePDF = () => {
    if (!invoiceData) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 30);
    
    // Company Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('EnamelPure', 20, 50);
    doc.text('Invoice Management System', 20, 60);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 70);
    
    // Invoice Details
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details', 20, 95);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`TID: ${invoiceData.tid}`, 20, 110);
    doc.text(`ID: ${invoiceData.id}`, 20, 125);
    doc.text(`Date: ${invoiceData.date}`, 20, 140);
    doc.text(`Time: ${invoiceData.time}`, 20, 155);
    doc.text(`Action: ${invoiceData.action}`, 20, 170);
    doc.text(`Duration: ${invoiceData.duration}`, 20, 185);
    
    // Billing
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Billing Information', 20, 210);
    
    // Table for billing
    doc.autoTable({
      startY: 220,
      head: [['Description', 'Duration', 'Rate', 'Amount']],
      body: [[
        `${invoiceData.action} Service`,
        invoiceData.duration,
        `$${invoiceData.charge}`,
        `$${invoiceData.charge}`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 12 }
    });
    
    // Total
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: $${invoiceData.charge}`, 120, finalY);
    
    
    doc.save(`invoice_${invoiceData.tid}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    if (!invoiceData) return;

    const csvContent = [
      'Field,Value',
      `TID,${invoiceData.tid}`,
      `ID,${invoiceData.id}`,
      `Date,${invoiceData.date}`,
      `Time,${invoiceData.time}`,
      `Action,${invoiceData.action}`,
      `Duration,${invoiceData.duration}`,
      `Charge,$${invoiceData.charge}`
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${invoiceData.tid}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg text-gray-600">Loading invoice details...</span>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Invoice Not Found</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center space-x-2 transition-colors ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className={`text-3xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>Invoice Details</h1>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors duration-200 ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-white hover:bg-gray-100 text-gray-700'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        {/* Invoice Card */}
        <div className={`rounded-lg shadow-lg p-8 mb-6 transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`border-b pb-6 mb-6 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>TID: {invoiceData.tid}</h2>
            <p className={`${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Invoice Details and Billing Information</p>
          </div>

          {/* Invoice Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>ID</p>
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{invoiceData.id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date</p>
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{invoiceData.date}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Time</p>
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{invoiceData.time}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-blue-600" />
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Action</p>
                  <p className={`font-semibold capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{invoiceData.action}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Duration</p>
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{invoiceData.duration}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Charge</p>
                  <p className="font-bold text-2xl text-green-600">${invoiceData.charge}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Summary */}
          <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Billing Summary</h3>
            <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-center">
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Service: {invoiceData.action}</span>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${invoiceData.charge}</span>
              </div>
              <div className={`flex justify-between items-center mt-2 pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total Amount</span>
                <span className="text-2xl font-bold text-green-600">${invoiceData.charge}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={generateInvoicePDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 shadow-lg"
          >
            <Download className="w-5 h-5" />
            <span>Download PDF Invoice</span>
          </button>
          
          <button
            onClick={exportToCSV}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 shadow-lg"
          >
            <FileText className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 shadow-lg"
          >
            <FileText className="w-5 h-5" />
            <span>Print Invoice</span>
          </button>
        </div>

        {message && (
          <div className={`text-center p-3 rounded-lg mt-6 ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail;
