import { useState } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient, fetchWithAuth } from "./lib/queryClient";
import { supabase } from "@/lib/supabase";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import AppLayout from "@/components/AppLayout";
import HomePage from "@/pages/home";
import ServicesPage from "@/pages/services";
import InvoicePage from "@/pages/invoice";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin";
import DashboardPage from "@/pages/dashboard";
import JobsPage from "@/pages/jobs";
import JobDetailPage from "@/pages/job-detail";
import SettingsPage from "@/pages/settings";

import { calculateInvoice } from "@/lib/invoice";
import type { JobInfo, Invoice } from "@/lib/invoice";
import type { Job } from "@shared/schema";

// ─── Wizard state + routing ────────────────────────────────────────────────────

function Router() {
  const [, setLocation] = useLocation();
  const { session } = useAuth();

  const [jobInfo, setJobInfo] = useState<JobInfo>({
    customerName: "",
    invoiceNumber: "",
    vehicleType: "",
    vehicleWeight: 0,
    problemDescription: "",
    fuelSurcharge: 20,
  });

  const [selectedServices, setSelectedServices] = useState<
    Record<number, boolean>
  >({});
  const [subcontractors, setSubcontractors] = useState<
    Array<{ name: string; workPerformed: string; price: number }>
  >([]);
  const [customServices, setCustomServices] = useState<
    Array<{ name: string; price: number }>
  >([]);
  const [isHazmat, setIsHazmat] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);

  // Only fetch services when user is authenticated
  // Pass token via meta to avoid race conditions with Supabase session state
  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!session,
    meta: { token: session?.access_token },
  });

  // ── Calculate invoice + persist job ─────────────────────────────────────
  const handleCalculateInvoice = async () => {
    const calculatedInvoice = calculateInvoice(
      jobInfo,
      selectedServices,
      services,
      subcontractors,
      customServices,
      isHazmat
    );
    setInvoice(calculatedInvoice);

    try {
      const res = await fetchWithAuth("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          customerName: jobInfo.customerName,
          invoiceNumber: jobInfo.invoiceNumber,
          vehicleType: jobInfo.vehicleType,
          vehicleWeight: jobInfo.vehicleWeight,
          problemDescription: jobInfo.problemDescription,
          fuelSurcharge: jobInfo.fuelSurcharge.toString(),
          subtotal: calculatedInvoice.subtotal.toString(),
          fuelSurchargeAmount:
            calculatedInvoice.fuelSurchargeAmount.toString(),
          total: calculatedInvoice.total.toString(),
        }),
      });

      if (res.ok) {
        const savedJob = await res.json();

        // Save selected services
        const servicesList = calculatedInvoice.services.map((s) => ({
          serviceId: s.id,
          cost: s.cost,
        }));

        await fetchWithAuth(`/api/jobs/${savedJob.id}/services`, {
          method: "POST",
          body: JSON.stringify({ services: servicesList }),
        });

        // Upload photos (multipart — can't use fetchWithAuth's JSON path)
        if (selectedPhotos.length > 0) {
          const formData = new FormData();
          selectedPhotos.forEach((photo) => {
            formData.append("photos", photo);
          });
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          await fetch(`/api/jobs/${savedJob.id}/photos`, {
            method: "POST",
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : {},
            body: formData,
          });
        }

        setCurrentJobId(savedJob.id);
        queryClient.invalidateQueries({ queryKey: ["/api/jobs/recent"] });
        queryClient.invalidateQueries({
          queryKey: ["/api/analytics/summary"],
        });
      }
    } catch (error) {
      console.error("Failed to save job:", error);
    }
  };

  // ── Load an existing job into wizard ─────────────────────────────────────
  const handleJobSelect = async (job: Job) => {
    setJobInfo({
      customerName: job.customerName,
      invoiceNumber: job.invoiceNumber,
      vehicleType: job.vehicleType,
      vehicleWeight: job.vehicleWeight,
      problemDescription: job.problemDescription,
      fuelSurcharge: parseFloat(job.fuelSurcharge),
    });
    setCurrentJobId(job.id);

    try {
      const res = await fetchWithAuth(`/api/jobs/${job.id}`);
      if (res.ok) {
        const jobWithServices = await res.json();

        const restoredServices: Record<number, boolean> = {};
        if (jobWithServices.invoiceServices) {
          jobWithServices.invoiceServices.forEach((is: any) => {
            restoredServices[is.serviceId] = true;
          });
        }
        setSelectedServices(restoredServices);

        const restoredInvoice = calculateInvoice(
          {
            customerName: job.customerName,
            invoiceNumber: job.invoiceNumber,
            vehicleType: job.vehicleType,
            vehicleWeight: job.vehicleWeight,
            problemDescription: job.problemDescription,
            fuelSurcharge: parseFloat(job.fuelSurcharge),
          },
          restoredServices,
          services
        );
        setInvoice(restoredInvoice);
        setLocation("/new/invoice");
      }
    } catch (error) {
      console.error("Failed to restore job:", error);
    }
  };

  // ── Reset wizard ──────────────────────────────────────────────────────────
  const handleReset = () => {
    setJobInfo({
      customerName: "",
      invoiceNumber: "",
      vehicleType: "",
      vehicleWeight: 0,
      problemDescription: "",
      fuelSurcharge: 20,
    });
    setSelectedServices({});
    setSubcontractors([]);
    setCustomServices([]);
    setIsHazmat(false);
    setInvoice(null);
    setSelectedPhotos([]);
    setCurrentJobId(null);
  };

  return (
    <Switch>
      {/* Public route */}
      <Route path="/auth" component={AuthPage} />

      {/* Redirect root to /dashboard */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>

      {/* Protected routes wrapped in AppLayout */}
      <ProtectedRoute
        path="/dashboard"
        component={() => (
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        )}
      />

      <ProtectedRoute
        path="/new"
        component={() => (
          <AppLayout>
            <div className="max-w-2xl mx-auto px-0 py-0">
              <HomePage
                jobInfo={jobInfo}
                setJobInfo={setJobInfo}
                selectedPhotos={selectedPhotos}
                setSelectedPhotos={setSelectedPhotos}
              />
            </div>
          </AppLayout>
        )}
      />

      <ProtectedRoute
        path="/new/services"
        component={() => (
          <AppLayout>
            <ServicesPage
              selectedServices={selectedServices}
              setSelectedServices={setSelectedServices}
              subcontractors={subcontractors}
              setSubcontractors={setSubcontractors}
              customServices={customServices}
              setCustomServices={setCustomServices}
              isHazmat={isHazmat}
              setIsHazmat={setIsHazmat}
              jobInfo={jobInfo}
              onCalculateInvoice={handleCalculateInvoice}
            />
          </AppLayout>
        )}
      />

      <ProtectedRoute
        path="/new/invoice"
        component={() => (
          <AppLayout>
            <InvoicePage
              invoice={invoice}
              onReset={handleReset}
              currentJobId={currentJobId}
            />
          </AppLayout>
        )}
      />

      <ProtectedRoute
        path="/jobs"
        component={() => (
          <AppLayout>
            <JobsPage />
          </AppLayout>
        )}
      />

      <ProtectedRoute
        path="/jobs/:id"
        component={() => (
          <AppLayout>
            <JobDetailPage />
          </AppLayout>
        )}
      />

      <ProtectedRoute
        path="/settings"
        component={() => (
          <AppLayout>
            <SettingsPage />
          </AppLayout>
        )}
      />

      <ProtectedRoute
        path="/admin"
        component={() => (
          <AppLayout>
            <AdminPage />
          </AppLayout>
        )}
      />
    </Switch>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

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
