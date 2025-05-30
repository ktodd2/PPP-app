import { useState, useCallback } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import HomePage from "@/pages/home";
import ServicesPage from "@/pages/services";
import InvoicePage from "@/pages/invoice";
import AuthPage from "@/pages/auth-page";
import Sidebar from "@/components/Sidebar";

import { calculateInvoice } from '@/lib/invoice';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import type { JobInfo, Invoice } from '@/lib/invoice';
import type { Job } from '@shared/schema';

function Router() {
  const [location, setLocation] = useLocation();
  const [jobInfo, setJobInfo] = useState<JobInfo>({
    customerName: '',
    invoiceNumber: '',
    vehicleType: '',
    vehicleWeight: 0,
    problemDescription: '',
    fuelSurcharge: 15
  });

  const [selectedServices, setSelectedServices] = useState<Record<number, boolean>>({});
  const [subcontractors, setSubcontractors] = useState<Array<{name: string; workPerformed: string; price: number}>>([]);
  const [customServices, setCustomServices] = useState<Array<{name: string; price: number}>>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ['/api/services'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  }) as { data: any[] };

  const handleCalculateInvoice = async () => {
    const calculatedInvoice = calculateInvoice(jobInfo, selectedServices, services, subcontractors, customServices);
    setInvoice(calculatedInvoice);
    
    // Save job to database
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: jobInfo.customerName,
          invoiceNumber: jobInfo.invoiceNumber,
          vehicleType: jobInfo.vehicleType,
          vehicleWeight: jobInfo.vehicleWeight,
          problemDescription: jobInfo.problemDescription,
          fuelSurcharge: jobInfo.fuelSurcharge.toString(),
          subtotal: calculatedInvoice.subtotal.toString(),
          fuelSurchargeAmount: calculatedInvoice.fuelSurchargeAmount.toString(),
          total: calculatedInvoice.total.toString()
        })
      });
      
      if (response.ok) {
        const savedJob = await response.json();
        
        // Save the selected services for this job
        const selectedServicesList = calculatedInvoice.services.map(service => ({
          serviceId: service.id,
          cost: service.cost
        }));
        
        await fetch(`/api/jobs/${savedJob.id}/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ services: selectedServicesList })
        });

        // Upload photos if any were selected
        if (selectedPhotos.length > 0) {
          const formData = new FormData();
          selectedPhotos.forEach((photo) => {
            formData.append('photos', photo);
          });

          await fetch(`/api/jobs/${savedJob.id}/photos`, {
            method: 'POST',
            body: formData,
          });
        }

        setCurrentJobId(savedJob.id);
        
        // Invalidate and refetch recent jobs cache
        queryClient.invalidateQueries({ queryKey: ['/api/jobs/recent'] });
      }
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const handleJobSelect = async (job: Job) => {
    // Restore job info
    setJobInfo({
      customerName: job.customerName,
      invoiceNumber: job.invoiceNumber,
      vehicleType: job.vehicleType,
      vehicleWeight: job.vehicleWeight,
      problemDescription: job.problemDescription,
      fuelSurcharge: parseFloat(job.fuelSurcharge)
    });

    // Fetch job services and rebuild the invoice
    try {
      const response = await fetch(`/api/jobs/${job.id}`);
      if (response.ok) {
        const jobWithServices = await response.json();
        
        // Restore selected services
        const restoredServices: Record<number, boolean> = {};
        if (jobWithServices.invoiceServices) {
          jobWithServices.invoiceServices.forEach((invoiceService: any) => {
            restoredServices[invoiceService.serviceId] = true;
          });
        }
        setSelectedServices(restoredServices);
        
        // Recreate the invoice
        const restoredInvoice = calculateInvoice(
          {
            customerName: job.customerName,
            invoiceNumber: job.invoiceNumber,
            vehicleType: job.vehicleType,
            vehicleWeight: job.vehicleWeight,
            problemDescription: job.problemDescription,
            fuelSurcharge: parseFloat(job.fuelSurcharge)
          },
          restoredServices,
          services
        );
        setInvoice(restoredInvoice);
        
        // Navigate to invoice page
        setLocation('/invoice');
      }
    } catch (error) {
      console.error('Failed to restore job:', error);
    }
  };

  const updateJobInfo = useCallback((updates: Partial<JobInfo>) => {
    setJobInfo(current => ({ ...current, ...updates }));
  }, []);

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
    setSubcontractors([]);
    setCustomServices([]);
    setInvoice(null);
    setCurrentJobId(null);
  };

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        ⚙️
      </button>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onJobSelect={handleJobSelect}
      />

      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute 
          path="/" 
          component={() => (
            <HomePage 
              jobInfo={jobInfo} 
              setJobInfo={updateJobInfo}
              selectedPhotos={selectedPhotos}
              setSelectedPhotos={setSelectedPhotos}
            />
          )}
        />
        <ProtectedRoute 
          path="/services" 
          component={() => (
            <ServicesPage 
              selectedServices={selectedServices}
              setSelectedServices={setSelectedServices}
              subcontractors={subcontractors}
              setSubcontractors={setSubcontractors}
              customServices={customServices}
              setCustomServices={setCustomServices}
              jobInfo={jobInfo}
              onCalculateInvoice={handleCalculateInvoice}
            />
          )}
        />
        <ProtectedRoute 
          path="/invoice" 
          component={() => (
            <InvoicePage 
              invoice={invoice}
              onReset={handleReset}
              currentJobId={currentJobId}
            />
          )}
        />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
