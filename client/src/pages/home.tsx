import { useState } from "react";
import { useLocation } from "wouter";
import type { JobInfo } from "@/lib/invoice";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StepIndicator from "@/components/StepIndicator";
import PhotoUpload from "@/components/PhotoUpload";

interface HomePageProps {
  jobInfo: JobInfo;
  setJobInfo: (jobInfo: JobInfo) => void;
  selectedPhotos: File[];
  setSelectedPhotos: (photos: File[]) => void;
}

export default function HomePage({
  jobInfo,
  setJobInfo,
  selectedPhotos,
  setSelectedPhotos,
}: HomePageProps) {
  const [, setLocation] = useLocation();

  // Local form state prevents re-render lag on controlled inputs
  const [form, setForm] = useState({
    customerName: jobInfo.customerName,
    invoiceNumber: jobInfo.invoiceNumber,
    vehicleType: jobInfo.vehicleType,
    vehicleWeight: jobInfo.vehicleWeight === 0 ? "" : String(jobInfo.vehicleWeight),
    problemDescription: jobInfo.problemDescription,
    fuelSurcharge: String(jobInfo.fuelSurcharge),
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleContinue = () => {
    const weight = parseFloat(form.vehicleWeight) || 0;
    const surcharge = parseFloat(form.fuelSurcharge) || 0;

    setJobInfo({
      customerName: form.customerName.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      vehicleType: form.vehicleType.trim(),
      vehicleWeight: weight,
      problemDescription: form.problemDescription.trim(),
      fuelSurcharge: surcharge,
    });

    setLocation("/new/services");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Step indicator */}
      <StepIndicator currentStep={1} />

      {/* Main form card */}
      <Card className="card-elevated">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-foreground">
            Job Details
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the job information to get started
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Row: Customer + Invoice # */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="customerName">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoiceNumber">
                Invoice Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="invoiceNumber"
                value={form.invoiceNumber}
                onChange={(e) => set("invoiceNumber", e.target.value)}
                placeholder="INV-0001"
              />
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="space-y-1.5">
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <Input
              id="vehicleType"
              value={form.vehicleType}
              onChange={(e) => set("vehicleType", e.target.value)}
              placeholder="e.g., 2020 Freightliner Cascadia"
            />
          </div>

          {/* Row: Weight + Fuel Surcharge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehicleWeight">
                Vehicle Weight (lbs) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vehicleWeight"
                type="number"
                inputMode="numeric"
                value={form.vehicleWeight}
                onChange={(e) => set("vehicleWeight", e.target.value)}
                placeholder="80000"
                min="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fuelSurcharge">Fuel Surcharge (%)</Label>
              <Input
                id="fuelSurcharge"
                type="number"
                inputMode="decimal"
                value={form.fuelSurcharge}
                onChange={(e) => set("fuelSurcharge", e.target.value)}
                placeholder="20"
                min="0"
                step="0.5"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="problemDescription">Description of Work</Label>
            <Textarea
              id="problemDescription"
              value={form.problemDescription}
              onChange={(e) => set("problemDescription", e.target.value)}
              placeholder="e.g., Rollover recovery on I-94, vehicle extraction from ditch"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-1.5">
            <Label>Job Photos</Label>
            <PhotoUpload
              photos={selectedPhotos}
              onPhotosChange={setSelectedPhotos}
            />
          </div>
        </CardContent>
      </Card>

      {/* Continue button */}
      <Button
        onClick={handleContinue}
        disabled={
          !form.customerName.trim() ||
          !form.invoiceNumber.trim() ||
          !form.vehicleWeight
        }
        className="w-full h-12 text-base font-semibold flex items-center justify-center gap-2"
        style={{ backgroundColor: "#0077B6" }}
      >
        Continue to Services
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
