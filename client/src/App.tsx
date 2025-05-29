import { useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import HomePage from "@/pages/home";
import ServicesPage from "@/pages/services";
import InvoicePage from "@/pages/invoice";

import { calculateInvoice } from '@/lib/invoice';
import { useQuery } from '@tanstack/react-query';
import type { JobInfo, Invoice } from '@/lib/invoice';

function Router() {
  const [jobInfo, setJobInfo] = useState<JobInfo>({
    customerName: '',
    invoiceNumber: '',
    vehicleType: '',
    vehicleWeight: 0,
    problemDescription: '',
    fuelSurcharge: 15
  });

  const [selectedServices, setSelectedServices] = useState<Record<number, boolean>>({});
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ['/api/services'],
  });

  const handleCalculateInvoice = () => {
    const calculatedInvoice = calculateInvoice(jobInfo, selectedServices, services);
    setInvoice(calculatedInvoice);
  };

  const handleReset = () => {
    setJobInfo({
      customerName: '',
      invoiceNumber: '',
      vehicleType: '',
      vehicleWeight: 0,
      problemDescription: '',
      fuelSurcharge: 15
    });
    setSelectedServices({});
    setInvoice(null);
  };

  return (
    <Switch>
      <Route path="/">
        <HomePage 
          jobInfo={jobInfo} 
          setJobInfo={setJobInfo} 
        />
      </Route>
      <Route path="/services">
        <ServicesPage 
          selectedServices={selectedServices}
          setSelectedServices={setSelectedServices}
          jobInfo={jobInfo}
          onCalculateInvoice={handleCalculateInvoice}
        />
      </Route>
      <Route path="/invoice">
        <InvoicePage 
          invoice={invoice}
          onReset={handleReset}
        />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
