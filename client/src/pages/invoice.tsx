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
  const { data: jobPhotos = [] } = useQuery<any[]>({
    queryKey: [`/api/jobs/${currentJobId}/photos`],
    enabled: !!currentJobId
  });

  // Debug logging
  console.log('Invoice page - currentJobId:', currentJobId);
  console.log('Invoice page - jobPhotos:', jobPhotos);

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
      await exportToPDF(invoice, jobPhotos, companySettings);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-foreground p-6 sticky top-0 z-10 no-print shadow-xl border-b border-border">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={handleBack} className="text-2xl hover:text-primary transition-colors">←</button>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">PPP Invoice Wizard</h1>
            <p className="text-sm text-primary font-light">Generated Invoice</p>
          </div>
          <button onClick={handleReset} className="text-sm bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg transition-colors font-medium">New</button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Invoice Card */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          {/* Company Header */}
          <div className="text-center mb-6 pb-4 border-b-2 border-border">
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
            <h1 className="text-2xl font-bold text-foreground">{companySettings?.companyName || 'Professional Towing'}</h1>
            <p className="text-muted-foreground text-sm">{companySettings?.companySubtitle || 'Heavy Duty Recovery Services'}</p>
            {companySettings?.address && <p className="text-muted-foreground text-xs">{companySettings.address}</p>}
            {companySettings?.phone && <p className="text-muted-foreground text-xs">{companySettings.phone}</p>}
            {companySettings?.email && <p className="text-muted-foreground text-xs">{companySettings.email}</p>}
          </div>

          {/* Invoice Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">INVOICE</h2>
              <span className="text-lg font-bold text-primary">#{invoice.invoiceNumber}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Date:</span> {invoice.date}</p>
              <p><span className="font-medium text-foreground">Customer:</span> {invoice.customerName}</p>
              <p><span className="font-medium text-foreground">Vehicle:</span> {invoice.vehicleType}</p>
              <p><span className="font-medium text-foreground">Weight:</span> {invoice.vehicleWeight.toLocaleString()} lbs</p>
              <p><span className="font-medium text-foreground">Description of Recovery and Work Performed:</span> {invoice.problemDescription}</p>
            </div>
          </div>

          {/* Services */}
          <div className="mb-6">
            <h3 className="font-bold text-foreground mb-3">Services Provided</h3>
            <div className="space-y-2">
              {invoice.services.map((service, index) => (
                <div key={index} className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex-1 text-foreground">{service.name}</span>
                  <span className="w-16 text-center text-primary">{service.rate.toFixed(1)}¢/lb</span>
                  <span className="w-16 text-right font-medium text-foreground">${service.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Services */}
          {invoice.customServices && invoice.customServices.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-foreground mb-3">Custom Services</h3>
              <div className="space-y-2">
                {invoice.customServices.map((service, index) => (
                  <div key={index} className="flex justify-between text-sm text-muted-foreground">
                    <span className="flex-1 text-foreground">{service.name}</span>
                    <span className="w-16 text-right font-medium text-foreground">${service.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subcontractors */}
          {invoice.subcontractors && invoice.subcontractors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-foreground mb-3">Subcontractors</h3>
              <div className="space-y-2">
                {invoice.subcontractors.map((sub, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <span className="font-medium text-foreground">{sub.name}</span>
                      <span className="text-muted-foreground ml-2">- {sub.workPerformed}</span>
                    </div>
                    <span className="w-16 text-right font-medium text-foreground">${sub.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job Photos - Enhanced */}
          {currentJobId && (
            <div className="mt-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                📸 Job Photos
              </h3>
              {jobPhotos && jobPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {jobPhotos.map((photo: any, index: number) => (
                    <div key={photo.id} className="photo-grid-item">
                      <img
                        src={photo.photoPath}
                        alt={`Job photo ${index + 1}`}
                        onError={(e) => {
                          console.error('Failed to load image:', photo.photoPath);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="absolute bottom-2 left-2 text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Photo {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No photos uploaded for this job.</p>
              )}
            </div>
          )}

          {/* Totals */}
          <div className="border-t-2 border-border pt-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-foreground">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.customServicesTotal > 0 && (
                <div className="flex justify-between">
                  <span>Custom Services:</span>
                  <span className="text-foreground">${invoice.customServicesTotal.toFixed(2)}</span>
                </div>
              )}
              {invoice.subcontractorTotal > 0 && (
                <div className="flex justify-between">
                  <span>Subcontractors:</span>
                  <span className="text-foreground">${invoice.subcontractorTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Fuel Surcharge ({invoice.fuelSurcharge}%):</span>
                <span className="text-foreground">${invoice.fuelSurchargeAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                <span>Total:</span>
                <span className="text-primary">${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground mt-6 pt-4 border-t border-border">
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
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-2xl shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? '📄 Generating PDF...' : '📄 Export PDF'}
          </button>
          
          <button
            onClick={handleShare}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-6 rounded-2xl text-lg shadow-2xl shadow-primary/20 active:scale-95 transition-all"
          >
            📤 Share Invoice
          </button>
          
          <button
            onClick={handlePrint}
            className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-4 px-6 rounded-2xl text-lg shadow-2xl shadow-secondary/20 active:scale-95 transition-all"
          >
            🖨️ Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
