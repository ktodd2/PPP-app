import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import type { Invoice } from '@/lib/invoice';
import type { CompanySettings } from '@shared/schema';
import { shareInvoice, printInvoice, exportToPDF } from '@/lib/invoice';

interface InvoicePageProps {
  invoice: Invoice | null;
  onReset: () => void;
  currentJobId?: number | null;
}

export default function InvoicePage({ invoice, onReset, currentJobId }: InvoicePageProps) {
  const [, setLocation] = useLocation();
  const [isExporting, setIsExporting] = useState(false);

  // Fetch company settings for the invoice
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ['/api/company']
  });

  // Fetch job photos if currentJobId is available
  const { data: jobPhotos = [] } = useQuery({
    queryKey: ['/api/jobs', currentJobId, 'photos'],
    enabled: !!currentJobId
  });

  const handleBack = () => {
    setLocation('/services');
  };

  const handleReset = () => {
    onReset();
    setLocation('/');
  };

  const handleShare = () => {
    if (invoice) {
      shareInvoice(invoice);
    }
  };

  const handlePrint = () => {
    printInvoice();
  };

  const handleExportPDF = async () => {
    if (!invoice) return;
    
    setIsExporting(true);
    try {
      await exportToPDF(invoice);
    } catch (error) {
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">No Invoice Data</h2>
          <button
            onClick={() => setLocation('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 sticky top-0 z-10 no-print">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={handleBack} className="text-2xl">←</button>
          <h1 className="text-xl font-bold">Invoice</h1>
          <button onClick={handleReset} className="text-sm bg-green-700 px-3 py-1 rounded-lg">New</button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Invoice Card */}
        <div className="bg-white rounded-3xl p-6 mb-6 shadow-xl">
          {/* Company Header */}
          <div className="text-center mb-6 pb-4 border-b-2 border-gray-100">
            <div className="mb-2">
              {companySettings?.companyLogo ? (
                companySettings.companyLogo.startsWith('/uploads/') ? (
                  <img 
                    src={companySettings.companyLogo} 
                    alt="Company Logo" 
                    className="w-16 h-16 object-contain mx-auto"
                  />
                ) : (
                  <div className="text-4xl">{companySettings.companyLogo}</div>
                )
              ) : (
                <div className="text-4xl">🚛</div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{companySettings?.companyName || 'Professional Towing'}</h1>
            <p className="text-gray-600 text-sm">{companySettings?.companySubtitle || 'Heavy Duty Recovery Services'}</p>
            {companySettings?.address && <p className="text-gray-600 text-xs">{companySettings.address}</p>}
            {companySettings?.phone && <p className="text-gray-600 text-xs">{companySettings.phone}</p>}
            {companySettings?.email && <p className="text-gray-600 text-xs">{companySettings.email}</p>}
          </div>

          {/* Invoice Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">INVOICE</h2>
              <span className="text-lg font-bold text-blue-600">#{invoice.invoiceNumber}</span>
            </div>
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">Date:</span> {invoice.date}</p>
              <p><span className="font-medium">Customer:</span> {invoice.customerName}</p>
              <p><span className="font-medium">Vehicle:</span> {invoice.vehicleType}</p>
              <p><span className="font-medium">Weight:</span> {invoice.vehicleWeight.toLocaleString()} lbs</p>
              <p><span className="font-medium">Problem:</span> {invoice.problemDescription}</p>
            </div>
          </div>

          {/* Services */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Services Provided</h3>
            <div className="space-y-2">
              {invoice.services.map((service, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="flex-1">{service.name}</span>
                  <span className="w-16 text-center">{service.rate.toFixed(1)}¢/lb</span>
                  <span className="w-16 text-right font-medium">${service.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Job Photos */}
          {jobPhotos && jobPhotos.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Job Photos</h3>
              <div className="grid grid-cols-5 gap-2">
                {jobPhotos.map((photo: any, index: number) => (
                  <div key={photo.id} className="aspect-square">
                    <img
                      src={photo.photoPath}
                      alt={`Job photo ${index + 1}`}
                      className="w-full h-full object-cover rounded border border-gray-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="border-t-2 border-gray-100 pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel Surcharge ({invoice.fuelSurcharge}%):</span>
                <span>${invoice.fuelSurchargeAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-gray-100">
            {companySettings?.invoiceFooter ? (
              companySettings.invoiceFooter.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))
            ) : (
              <>
                <p>Thank you for your business!</p>
                <p>Payment due within 30 days</p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 no-print">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="w-full bg-red-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? '📄 Generating PDF...' : '📄 Export PDF'}
          </button>
          
          <button
            onClick={handleShare}
            className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg active:scale-95 transition-transform"
          >
            📤 Share Invoice
          </button>
          
          <button
            onClick={handlePrint}
            className="w-full bg-gray-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg active:scale-95 transition-transform"
          >
            🖨️ Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
