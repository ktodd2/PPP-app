import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import type { Invoice } from '@/lib/invoice';
import type { CompanySettings } from '@shared/schema';
import { shareInvoice, printInvoice, exportToPDF } from '@/lib/invoice';
import { ChevronLeft, Plus, FileText, Download, Share2, Printer, Camera, Truck, Calendar, User, Scale, Wrench } from 'lucide-react';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 bg-primary/20 rounded-2xl mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">No Invoice Data</h2>
          <p className="text-muted-foreground mb-4">Create a new invoice to get started</p>
          <button
            onClick={() => setLocation('/')}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      {/* Header */}
      <div className="header-gradient text-foreground p-5 sticky top-0 z-10 no-print shadow-xl border-b border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight">Invoice</h1>
            <p className="text-xs text-primary font-medium">#{invoice.invoiceNumber}</p>
          </div>
          <button
            onClick={handleReset}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 relative">
        {/* Invoice Card */}
        <div className="glass-card rounded-3xl overflow-hidden mb-6">
          {/* Company Header */}
          <div className="bg-gradient-to-br from-white/[0.08] to-transparent p-6 text-center border-b border-white/10">
            <div className="mb-3">
              {companySettings?.companyLogo ? (
                companySettings.companyLogo.startsWith('/uploads/') ? (
                  <img
                    src={companySettings.companyLogo}
                    alt="Company Logo"
                    className="w-16 h-16 object-contain mx-auto rounded-xl"
                  />
                ) : (
                  <div className="text-4xl">{companySettings.companyLogo}</div>
                )
              ) : (
                <div className="inline-block p-3 bg-primary/20 rounded-xl">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground mb-1">{companySettings?.companyName || 'Professional Towing'}</h1>
            <p className="text-muted-foreground text-sm mb-2">{companySettings?.companySubtitle || 'Heavy Duty Recovery Services'}</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              {companySettings?.address && <p>{companySettings.address}</p>}
              {companySettings?.phone && <p>{companySettings.phone}</p>}
              {companySettings?.email && <p>{companySettings.email}</p>}
            </div>
          </div>

          <div className="p-6">
            {/* Invoice Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Date</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{invoice.date}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Customer</span>
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{invoice.customerName}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Vehicle</span>
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{invoice.vehicleType}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Weight</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{invoice.vehicleWeight.toLocaleString()} lbs</p>
              </div>
            </div>

            {/* Work Description */}
            {invoice.problemDescription && (
              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Work Performed</span>
                </div>
                <p className="text-sm text-foreground">{invoice.problemDescription}</p>
              </div>
            )}

            {/* Services */}
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Services</h3>
              <div className="space-y-2">
                {invoice.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center text-sm bg-white/5 rounded-lg p-3 border border-white/5">
                    <span className="flex-1 text-foreground font-medium truncate mr-2">{service.name}</span>
                    <span className="text-xs text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full">{service.rate.toFixed(1)}¢/lb</span>
                    <span className="w-20 text-right font-semibold text-foreground">${service.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Services */}
            {invoice.customServices && invoice.customServices.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Custom Services</h3>
                <div className="space-y-2">
                  {invoice.customServices.map((service, index) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-white/5 rounded-lg p-3 border border-white/5">
                      <span className="flex-1 text-foreground font-medium">{service.name}</span>
                      <span className="font-semibold text-foreground">${service.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subcontractors */}
            {invoice.subcontractors && invoice.subcontractors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Subcontractors</h3>
                <div className="space-y-2">
                  {invoice.subcontractors.map((sub, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/5">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="font-medium text-foreground text-sm">{sub.name}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{sub.workPerformed}</p>
                        </div>
                        <span className="font-semibold text-foreground text-sm">${sub.price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Job Photos */}
            {currentJobId && jobPhotos && jobPhotos.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Job Photos</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {jobPhotos.map((photo: any, index: number) => (
                    <div key={photo.id} className="photo-grid-item group">
                      <img
                        src={photo.photoPath}
                        alt={`Job photo ${index + 1}`}
                        onError={(e) => {
                          console.error('Failed to load image:', photo.photoPath);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/90 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl p-4 border border-white/10">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground font-medium">${invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.customServicesTotal > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Custom Services</span>
                    <span className="text-foreground font-medium">${invoice.customServicesTotal.toFixed(2)}</span>
                  </div>
                )}
                {invoice.subcontractorTotal > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subcontractors</span>
                    <span className="text-foreground font-medium">${invoice.subcontractorTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Fuel Surcharge ({invoice.fuelSurcharge}%)</span>
                  <span className="text-foreground font-medium">${invoice.fuelSurchargeAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 mt-2 border-t border-white/10">
                  <span className="text-foreground">Total</span>
                  <span className="gradient-text">${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground mt-6 pt-4 border-t border-white/10">
              {companySettings?.invoiceFooter ? (
                companySettings.invoiceFooter.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))
              ) : (
                <>
                  <p className="font-medium text-foreground/80">Thank you for your business!</p>
                  <p>Payment due within 30 days</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 no-print">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="w-full bg-gradient-to-r from-destructive to-destructive/80 text-white font-bold py-4 px-6 rounded-2xl text-base btn-modern flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-5 w-5" />
            {isExporting ? 'Generating PDF...' : 'Export PDF'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              className="bg-primary/20 hover:bg-primary/30 text-primary font-semibold py-3.5 px-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 border border-primary/30"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <button
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/15 text-foreground font-semibold py-3.5 px-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
