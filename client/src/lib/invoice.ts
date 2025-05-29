import type { TowingService } from './services';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface JobInfo {
  customerName: string;
  invoiceNumber: string;
  vehicleType: string;
  vehicleWeight: number;
  problemDescription: string;
  fuelSurcharge: number;
}

export interface ServiceWithCost extends TowingService {
  cost: number;
}

export interface Invoice {
  customerName: string;
  invoiceNumber: string;
  vehicleType: string;
  vehicleWeight: number;
  problemDescription: string;
  fuelSurcharge: number;
  services: ServiceWithCost[];
  subtotal: number;
  fuelSurchargeAmount: number;
  total: number;
  date: string;
}

export function calculateInvoice(
  jobInfo: JobInfo,
  selectedServices: Record<number, boolean>,
  allServices: TowingService[]
): Invoice {
  const selectedServicesList = allServices.filter(service => selectedServices[service.id]);
  
  const servicesWithCosts: ServiceWithCost[] = selectedServicesList.map(service => {
    const rate = typeof service.rate === 'string' ? parseFloat(service.rate) : service.rate;
    const cost = (jobInfo.vehicleWeight * rate) / 100;
    return {
      ...service,
      rate,
      cost
    };
  });

  const subtotal = servicesWithCosts.reduce((sum, service) => sum + service.cost, 0);
  const fuelSurchargeAmount = subtotal * (jobInfo.fuelSurcharge / 100);
  const total = subtotal + fuelSurchargeAmount;

  return {
    ...jobInfo,
    services: servicesWithCosts,
    subtotal,
    fuelSurchargeAmount,
    total,
    date: new Date().toLocaleDateString()
  };
}

export function shareInvoice(invoice: Invoice) {
  const invoiceText = `Invoice #${invoice.invoiceNumber}\nCustomer: ${invoice.customerName}\nTotal: $${invoice.total.toFixed(2)}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Towing Invoice',
      text: invoiceText
    }).catch(() => {
      // User cancelled share or share failed, no need to show error
    });
  } else {
    // Fallback for browsers that don't support Web Share API
    navigator.clipboard.writeText(invoiceText).then(() => {
      alert('Invoice details copied to clipboard!');
    }).catch(() => {
      // Fallback if clipboard API is not available
      prompt('Copy this invoice text:', invoiceText);
    });
  }
}

export function printInvoice() {
  window.print();
}

export async function exportToPDF(invoice: Invoice) {
  try {
    // Create a temporary div for PDF generation
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20mm';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    
    // Create PDF-optimized invoice content
    tempDiv.innerHTML = `
      <div style="max-width: 170mm; margin: 0 auto;">
        <!-- Company Header -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
          <div style="font-size: 48px; margin-bottom: 10px;">🚛</div>
          <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">Professional Towing</h1>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Heavy Duty Recovery Services</p>
        </div>

        <!-- Invoice Header -->
        <div style="margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0;">INVOICE</h2>
            <span style="font-size: 20px; font-weight: bold; color: #2563eb;">#${invoice.invoiceNumber}</span>
          </div>
          <div style="font-size: 14px; color: #4b5563; line-height: 1.6;">
            <p style="margin: 4px 0;"><strong>Date:</strong> ${invoice.date}</p>
            <p style="margin: 4px 0;"><strong>Customer:</strong> ${invoice.customerName}</p>
            <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${invoice.vehicleType}</p>
            <p style="margin: 4px 0;"><strong>Weight:</strong> ${invoice.vehicleWeight.toLocaleString()} lbs</p>
            <p style="margin: 4px 0;"><strong>Problem:</strong> ${invoice.problemDescription}</p>
          </div>
        </div>

        <!-- Services Table -->
        <div style="margin-bottom: 30px;">
          <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 15px; font-size: 18px;">Services Provided</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                <th style="text-align: left; padding: 12px 8px; font-weight: 600; color: #374151;">Service</th>
                <th style="text-align: center; padding: 12px 8px; font-weight: 600; color: #374151; width: 80px;">Rate</th>
                <th style="text-align: right; padding: 12px 8px; font-weight: 600; color: #374151; width: 80px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.services.map(service => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 8px; color: #374151;">${service.name}</td>
                  <td style="padding: 10px 8px; text-align: center; color: #374151;">${service.rate.toFixed(1)}¢/lb</td>
                  <td style="padding: 10px 8px; text-align: right; font-weight: 500; color: #374151;">$${service.cost.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div style="border-top: 2px solid #e5e7eb; padding-top: 20px;">
          <div style="text-align: right; font-size: 14px; line-height: 1.8;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #4b5563;">Subtotal:</span>
              <span style="color: #374151; font-weight: 500;">$${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #4b5563;">Fuel Surcharge (${invoice.fuelSurcharge}%):</span>
              <span style="color: #374151; font-weight: 500;">$${invoice.fuelSurchargeAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #d1d5db; font-size: 18px;">
              <span style="color: #1f2937; font-weight: bold;">Total:</span>
              <span style="color: #1f2937; font-weight: bold;">$${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 4px 0;">Thank you for your business!</p>
          <p style="margin: 4px 0;">Payment due within 30 days</p>
        </div>
      </div>
    `;

    document.body.appendChild(tempDiv);

    // Generate canvas from the temp div
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123 // A4 height in pixels at 96 DPI
    });

    // Remove temp div
    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    const fileName = `Invoice_${invoice.invoiceNumber}_${invoice.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    pdf.save(fileName);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}
