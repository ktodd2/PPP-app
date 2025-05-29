import type { TowingService } from './services';

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
