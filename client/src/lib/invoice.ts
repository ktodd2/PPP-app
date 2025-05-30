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

export interface SubcontractorItem {
  id?: number;
  name: string;
  workPerformed: string;
  price: number;
}

export interface Invoice {
  customerName: string;
  invoiceNumber: string;
  vehicleType: string;
  vehicleWeight: number;
  problemDescription: string;
  fuelSurcharge: number;
  services: ServiceWithCost[];
  customServices: Array<{name: string; price: number}>;
  subcontractors: SubcontractorItem[];
  subtotal: number;
  customServicesTotal: number;
  subcontractorTotal: number;
  fuelSurchargeAmount: number;
  total: number;
  date: string;
}

export function calculateInvoice(
  jobInfo: JobInfo,
  selectedServices: Record<number, boolean>,
  allServices: TowingService[],
  subcontractors: SubcontractorItem[] = [],
  customServices: Array<{name: string; price: number}> = []
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
  const customServicesTotal = customServices.reduce((sum, service) => sum + service.price, 0);
  const subcontractorTotal = subcontractors.reduce((sum, sub) => sum + sub.price, 0);
  const fuelSurchargeAmount = (subtotal + customServicesTotal) * (jobInfo.fuelSurcharge / 100);
  const total = subtotal + customServicesTotal + subcontractorTotal + fuelSurchargeAmount;

  return {
    ...jobInfo,
    services: servicesWithCosts,
    customServices,
    subcontractors,
    subtotal,
    customServicesTotal,
    subcontractorTotal,
    fuelSurchargeAmount,
    total,
    date: new Date().toLocaleDateString()
  };
}

export async function shareInvoice(invoice: Invoice, jobPhotos: any[] = [], companySettings: any = null) {
  try {
    // Generate PDF and share it
    await exportToPDF(invoice, jobPhotos, companySettings);
  } catch (error) {
    // Fallback to text sharing if PDF export fails
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
}

export function printInvoice() {
  window.print();
}

export async function exportToPDF(invoice: Invoice, jobPhotos: any[] = [], companySettings: any = null) {
  try {
    // Convert logo to data URL if it exists
    let logoDataUrl = '';
    if (companySettings?.companyLogo && companySettings.companyLogo.startsWith('/uploads/')) {
      try {
        const response = await fetch(companySettings.companyLogo);
        const blob = await response.blob();
        logoDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn('Failed to load logo for PDF export:', error);
      }
    }

    // Convert photos to data URLs
    const photoDataUrls: Array<any & { dataUrl: string }> = [];
    for (const photo of jobPhotos) {
      try {
        const response = await fetch(photo.photoPath);
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        photoDataUrls.push({ ...photo, dataUrl });
      } catch (error) {
        console.warn('Failed to load photo for PDF export:', error);
      }
    }

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
          ${logoDataUrl 
            ? `<img src="${logoDataUrl}" alt="Company Logo" style="width: 64px; height: 64px; object-fit: contain; margin: 0 auto 10px auto; display: block;" />`
            : `<div style="font-size: 48px; margin-bottom: 10px;">${companySettings?.companyLogo || '🚛'}</div>`
          }
          <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">${companySettings?.companyName || 'Professional Towing'}</h1>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">${companySettings?.companySubtitle || 'Heavy Duty Recovery Services'}</p>
          ${companySettings?.address ? `<p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">${companySettings.address}</p>` : ''}
          ${companySettings?.phone ? `<p style="color: #6b7280; font-size: 12px; margin: 2px 0 0 0;">${companySettings.phone}</p>` : ''}
          ${companySettings?.email ? `<p style="color: #6b7280; font-size: 12px; margin: 2px 0 0 0;">${companySettings.email}</p>` : ''}
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
            <p style="margin: 4px 0;"><strong>Description of Recovery and Work Performed:</strong> ${invoice.problemDescription}</p>
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

        ${invoice.customServices && invoice.customServices.length > 0 ? `
        <!-- Custom Services -->
        <div style="margin-bottom: 30px;">
          <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 15px; font-size: 18px;">Custom Services</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                <th style="text-align: left; padding: 12px 8px; font-weight: 600; color: #374151;">Service</th>
                <th style="text-align: right; padding: 12px 8px; font-weight: 600; color: #374151;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.customServices.map(service => `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 8px; color: #374151;">${service.name}</td>
                  <td style="text-align: right; padding: 12px 8px; color: #374151; font-weight: 500;">$${service.price.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${invoice.subcontractors && invoice.subcontractors.length > 0 ? `
        <!-- Subcontractors -->
        <div style="margin-bottom: 30px;">
          <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 15px; font-size: 18px;">Subcontractors</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                <th style="text-align: left; padding: 12px 8px; font-weight: 600; color: #374151;">Name</th>
                <th style="text-align: left; padding: 12px 8px; font-weight: 600; color: #374151;">Work Performed</th>
                <th style="text-align: right; padding: 12px 8px; font-weight: 600; color: #374151;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.subcontractors.map(sub => `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 8px; color: #374151; font-weight: 500;">${sub.name}</td>
                  <td style="padding: 12px 8px; color: #374151;">${sub.workPerformed}</td>
                  <td style="text-align: right; padding: 12px 8px; color: #374151; font-weight: 500;">$${sub.price.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Totals -->
        <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="text-align: right; padding: 4px 0; color: #4b5563;">Subtotal:</td>
              <td style="text-align: right; padding: 4px 0 4px 20px; color: #374151; font-weight: 500; width: 100px;">$${invoice.subtotal.toFixed(2)}</td>
            </tr>
            ${invoice.customServicesTotal > 0 ? `
            <tr>
              <td style="text-align: right; padding: 4px 0; color: #4b5563;">Custom Services:</td>
              <td style="text-align: right; padding: 4px 0 4px 20px; color: #374151; font-weight: 500;">$${invoice.customServicesTotal.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${invoice.subcontractorTotal > 0 ? `
            <tr>
              <td style="text-align: right; padding: 4px 0; color: #4b5563;">Subcontractors:</td>
              <td style="text-align: right; padding: 4px 0 4px 20px; color: #374151; font-weight: 500;">$${invoice.subcontractorTotal.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="text-align: right; padding: 4px 0; color: #4b5563;">Fuel Surcharge (${invoice.fuelSurcharge}%):</td>
              <td style="text-align: right; padding: 4px 0 4px 20px; color: #374151; font-weight: 500;">$${invoice.fuelSurchargeAmount.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px solid #d1d5db;">
              <td style="text-align: right; padding: 12px 0 4px 0; color: #1f2937; font-weight: bold; font-size: 18px;">Total:</td>
              <td style="text-align: right; padding: 12px 0 4px 20px; color: #1f2937; font-weight: bold; font-size: 18px;">$${invoice.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${photoDataUrls && photoDataUrls.length > 0 ? `
        <!-- Job Photos -->
        <div style="margin-top: 30px; page-break-inside: avoid;">
          <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 15px; font-size: 18px;">Job Photos</h3>
          <table style="width: 100%; border-collapse: separate; border-spacing: 10px;">
            ${Array.from({ length: Math.ceil(photoDataUrls.length / 3) }, (_, rowIndex) => `
              <tr>
                ${photoDataUrls.slice(rowIndex * 3, (rowIndex + 1) * 3).map(photo => `
                  <td style="width: 33.33%; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden; height: 120px; text-align: center; vertical-align: middle; padding: 0;">
                    <img src="${photo.dataUrl}" style="max-width: 100%; max-height: 120px; object-fit: cover;" alt="Job photo" />
                  </td>
                `).join('')}
                ${photoDataUrls.slice(rowIndex * 3, (rowIndex + 1) * 3).length < 3 ? 
                  Array.from({ length: 3 - photoDataUrls.slice(rowIndex * 3, (rowIndex + 1) * 3).length }, () => '<td style="width: 33.33%;"></td>').join('') : ''}
              </tr>
            `).join('')}
          </table>
        </div>
        ` : ''}

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
