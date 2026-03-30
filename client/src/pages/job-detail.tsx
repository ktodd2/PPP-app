import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuthQuery } from "@/hooks/use-auth-query";
import type { CompanySettings, TowingService } from "@shared/schema";
import { exportToPDF, shareInvoice, type Invoice } from "@/lib/invoice";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  Download,
  Share2,
  Printer,
  Truck,
  Loader2,
  ChevronLeft,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobWithServices {
  id: number;
  customerName: string;
  invoiceNumber: string;
  vehicleType: string;
  vehicleWeight: number;
  problemDescription: string;
  fuelSurcharge: string;
  createdAt: string;
  invoiceServices: Array<{
    id: number;
    serviceId: number;
    cost: string;
  }>;
}

interface JobPhoto {
  id: number;
  photoPath: string;
}

export default function JobDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/jobs/:id");
  const jobId = params?.id;

  const [isExporting, setIsExporting] = useState(false);

  const { data: job, isLoading: jobLoading } = useAuthQuery<JobWithServices>(
    [`/api/jobs/${jobId}`],
    { enabled: !!jobId }
  );

  const { data: jobPhotos = [] } = useAuthQuery<JobPhoto[]>(
    [`/api/jobs/${jobId}/photos`],
    { enabled: !!jobId }
  );

  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/company"],
  });

  const { data: allServices = [] } = useAuthQuery<TowingService[]>([
    "/api/services",
  ]);

  // Build invoice-like object for PDF export and display
  const invoice: Invoice | null = job
    ? (() => {
        const servicesWithCosts = job.invoiceServices
          .map((is) => {
            const service = allServices.find((s) => s.id === is.serviceId);
            if (!service) return null;
            return {
              id: service.id,
              name: service.name,
              rate: parseFloat(service.rate),
              cost: parseFloat(is.cost),
            };
          })
          .filter((s): s is NonNullable<typeof s> => s !== null);

        const subtotal = servicesWithCosts.reduce((sum, s) => sum + s.cost, 0);
        const fuelSurcharge = parseFloat(job.fuelSurcharge);
        const fuelSurchargeAmount = subtotal * (fuelSurcharge / 100);
        const total = subtotal + fuelSurchargeAmount;

        return {
          customerName: job.customerName,
          invoiceNumber: job.invoiceNumber,
          vehicleType: job.vehicleType,
          vehicleWeight: job.vehicleWeight,
          problemDescription: job.problemDescription,
          fuelSurcharge,
          services: servicesWithCosts,
          customServices: [],
          subcontractors: [],
          subtotal,
          customServicesTotal: 0,
          subcontractorTotal: 0,
          fuelSurchargeAmount,
          total,
          date: new Date(job.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
      })()
    : null;

  const handleExportPDF = async () => {
    if (!invoice) return;
    setIsExporting(true);
    try {
      await exportToPDF(invoice, jobPhotos, companySettings);
    } catch {
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    if (invoice) {
      shareInvoice(invoice);
    }
  };

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="p-4 rounded-full bg-[#0077B6]/10">
          <FileText className="h-8 w-8 text-[#0077B6]" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Job Not Found</h2>
        <p className="text-muted-foreground text-sm text-center">
          The job you're looking for doesn't exist or you don't have access.
        </p>
        <Button
          onClick={() => setLocation("/jobs")}
          style={{ backgroundColor: "#0077B6" }}
        >
          Back to Jobs
        </Button>
      </div>
    );
  }

  const companyName = companySettings?.companyName || "Professional Towing";
  const companySubtitle =
    companySettings?.companySubtitle || "Heavy Duty Recovery Services";

  return (
    <div className="bg-muted/40 min-h-screen pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Invoice document */}
        <div
          className="bg-white rounded-xl shadow-md overflow-hidden no-print"
          id="invoice-document"
        >
          {/* Company header */}
          <div
            className="px-8 py-7 text-center"
            style={{ backgroundColor: "#0077B6" }}
          >
            {companySettings?.companyLogo ? (
              companySettings.companyLogo.startsWith("logos/") ? (
                <img
                  src={supabase.storage.from("company-assets").getPublicUrl(companySettings.companyLogo).data.publicUrl}
                  alt="Company Logo"
                  className="w-16 h-16 object-contain mx-auto rounded-lg mb-3 bg-white/10 p-1"
                />
              ) : companySettings.companyLogo.startsWith("/uploads/") ? (
                <img
                  src={companySettings.companyLogo}
                  alt="Company Logo"
                  className="w-16 h-16 object-contain mx-auto rounded-lg mb-3 bg-white/10 p-1"
                />
              ) : (
                <div className="text-4xl mb-3">{companySettings.companyLogo}</div>
              )
            ) : (
              <div className="inline-block p-3 bg-white/20 rounded-xl mb-3">
                <Truck className="h-8 w-8 text-white" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-white">{companyName}</h1>
            <p className="text-white/80 text-sm mt-1">{companySubtitle}</p>
            {companySettings?.address && (
              <p className="text-white/70 text-xs mt-1">
                {companySettings.address}
              </p>
            )}
            {companySettings?.phone && (
              <p className="text-white/70 text-xs">{companySettings.phone}</p>
            )}
            {companySettings?.email && (
              <p className="text-white/70 text-xs">{companySettings.email}</p>
            )}
          </div>

          <div className="px-6 sm:px-8 py-6 space-y-6">
            {/* Invoice number + date */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Invoice
                </p>
                <p className="text-2xl font-bold text-foreground mt-0.5">
                  #{invoice.invoiceNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Date
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {invoice.date}
                </p>
              </div>
            </div>

            {/* Customer + vehicle info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Customer", value: invoice.customerName },
                { label: "Vehicle", value: invoice.vehicleType || "—" },
                {
                  label: "Weight",
                  value: `${invoice.vehicleWeight.toLocaleString()} lbs`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="bg-muted/60 rounded-lg px-3 py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    {row.label}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
                    {row.value}
                  </p>
                </div>
              ))}
              {invoice.problemDescription && (
                <div className="col-span-2 bg-muted/60 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Description of Work
                  </p>
                  <p className="text-sm text-foreground mt-0.5">
                    {invoice.problemDescription}
                  </p>
                </div>
              )}
            </div>

            {/* Services table */}
            {invoice.services.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">
                  Services
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-muted-foreground">
                        Service
                      </th>
                      <th className="text-center py-2 font-medium text-muted-foreground w-20">
                        Rate
                      </th>
                      <th className="text-right py-2 font-medium text-muted-foreground w-24">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.services.map((service, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2.5 text-foreground">{service.name}</td>
                        <td className="py-2.5 text-center text-muted-foreground">
                          {service.rate.toFixed(1)}¢/lb
                        </td>
                        <td className="py-2.5 text-right font-medium text-foreground">
                          ${service.cost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">
                  ${invoice.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Fuel Surcharge ({invoice.fuelSurcharge}%)</span>
                <span className="font-medium text-foreground">
                  ${invoice.fuelSurchargeAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span className="text-foreground">Total</span>
                <span style={{ color: "#0077B6" }}>
                  ${invoice.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Job Photos */}
            {jobPhotos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                    Job Photos
                  </p>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {jobPhotos.map((photo, i) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-md overflow-hidden border border-border bg-muted"
                    >
                      <img
                        src={photo.photoPath}
                        alt={`Job photo ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
              {companySettings?.invoiceFooter ? (
                companySettings.invoiceFooter
                  .split("\n")
                  .map((line, i) => <p key={i}>{line}</p>)
              ) : (
                <>
                  <p className="font-medium text-foreground/80">
                    Thank you for your business!
                  </p>
                  <p>Payment due within 30 days</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Desktop action buttons */}
        <div className="hidden md:flex gap-3 no-print">
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 font-semibold"
            style={{ backgroundColor: "#0077B6" }}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? "Generating..." : "Export PDF"}
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/jobs")}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </div>

      {/* Mobile fixed bottom action bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 no-print"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            size="sm"
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold"
            style={{ backgroundColor: "#0077B6" }}
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLocation("/jobs")}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
