import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { JobInfo } from "@/lib/invoice";
import type { TowingService } from "@/lib/services";
import { Plus, X, ChevronLeft, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StepIndicator from "@/components/StepIndicator";

// ─── Service categories ────────────────────────────────────────────────────────

const CATEGORIES: { label: string; serviceIds: number[] }[] = [
  {
    label: "Recovery",
    serviceIds: [1, 2, 3, 4, 5, 6],
  },
  {
    label: "Environmental",
    serviceIds: [7, 8],
  },
  {
    label: "Travel",
    serviceIds: [9, 10],
  },
  {
    label: "Damage / Collision",
    serviceIds: [11, 12, 13, 14, 15, 16, 17, 18, 19],
  },
];

interface CustomService {
  name: string;
  price: number;
}

interface ServicesPageProps {
  selectedServices: Record<number, boolean>;
  setSelectedServices: (services: Record<number, boolean>) => void;
  subcontractors: Array<{
    name: string;
    workPerformed: string;
    price: number;
  }>;
  setSubcontractors: (
    subs: Array<{ name: string; workPerformed: string; price: number }>
  ) => void;
  customServices: CustomService[];
  setCustomServices: (services: CustomService[]) => void;
  jobInfo: JobInfo;
  onCalculateInvoice: () => void;
}

export default function ServicesPage({
  selectedServices,
  setSelectedServices,
  subcontractors,
  setSubcontractors,
  customServices,
  setCustomServices,
  jobInfo,
  onCalculateInvoice,
}: ServicesPageProps) {
  const [, setLocation] = useLocation();

  const [newSub, setNewSub] = useState({
    name: "",
    workPerformed: "",
    price: "",
  });
  const [newCustom, setNewCustom] = useState({ name: "", price: "" });

  const { data: services = [], isLoading, isError } = useQuery<TowingService[]>(
    { queryKey: ["/api/services"] }
  );

  const toggle = (id: number) =>
    setSelectedServices({ ...selectedServices, [id]: !selectedServices[id] });

  // Running total estimate
  const runningTotal = services
    .filter((s) => selectedServices[s.id])
    .reduce((sum, s) => {
      const rate =
        typeof s.rate === "string" ? parseFloat(s.rate) : s.rate;
      return sum + (jobInfo.vehicleWeight * rate) / 100;
    }, 0);

  const customTotal = customServices.reduce((sum, s) => sum + s.price, 0);
  const subTotal = subcontractors.reduce((sum, s) => sum + s.price, 0);
  const fuelAmount =
    (runningTotal + customTotal) * (jobInfo.fuelSurcharge / 100);
  const estimatedTotal = runningTotal + customTotal + subTotal + fuelAmount;

  const addCustom = () => {
    const price = parseFloat(newCustom.price);
    if (!newCustom.name.trim() || isNaN(price) || price <= 0) return;
    setCustomServices([
      ...customServices,
      { name: newCustom.name.trim(), price },
    ]);
    setNewCustom({ name: "", price: "" });
  };

  const addSub = () => {
    const price = parseFloat(newSub.price);
    if (!newSub.name.trim() || !newSub.workPerformed.trim() || isNaN(price) || price <= 0)
      return;
    setSubcontractors([
      ...subcontractors,
      { name: newSub.name.trim(), workPerformed: newSub.workPerformed.trim(), price },
    ]);
    setNewSub({ name: "", workPerformed: "", price: "" });
  };

  const handleCalculate = () => {
    const hasServices =
      services.some((s) => selectedServices[s.id]) ||
      customServices.length > 0;
    if (!hasServices || !jobInfo.vehicleWeight) {
      alert(
        "Please select at least one service and ensure vehicle weight is entered."
      );
      return;
    }
    onCalculateInvoice();
    setLocation("/new/invoice");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0077B6]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-destructive font-medium mb-4">
          Failed to load services.
        </p>
        <Button variant="outline" onClick={() => setLocation("/new")}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Step indicator */}
      <StepIndicator currentStep={2} />

      {/* Grouped service categories */}
      {CATEGORIES.map((cat) => {
        const catServices = services.filter((s) =>
          cat.serviceIds.includes(s.id)
        );
        if (catServices.length === 0) return null;

        return (
          <Card key={cat.label} className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">
                {cat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {catServices.map((service) => {
                const rate =
                  typeof service.rate === "string"
                    ? parseFloat(service.rate)
                    : service.rate;
                const isSelected = selectedServices[service.id] || false;

                return (
                  <div
                    key={service.id}
                    className={[
                      "flex items-center justify-between px-3 py-3 rounded-md border service-toggle cursor-pointer",
                      isSelected
                        ? "border-[#0077B6]/40 bg-[#0077B6]/5"
                        : "border-border bg-background hover:bg-muted",
                    ].join(" ")}
                    onClick={() => toggle(service.id)}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {service.name}
                      </p>
                      <p className="text-xs text-[#0077B6] font-semibold mt-0.5">
                        {rate.toFixed(1)}¢/lb
                        {jobInfo.vehicleWeight > 0 && (
                          <span className="text-muted-foreground font-normal ml-1.5">
                            ≈ $
                            {(
                              (jobInfo.vehicleWeight * rate) /
                              100
                            ).toFixed(2)}
                          </span>
                        )}
                      </p>
                    </div>
                    <Switch
                      checked={isSelected}
                      onCheckedChange={() => toggle(service.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="data-[state=checked]:bg-[#0077B6]"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Custom Services */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Custom Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customServices.map((service, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2.5 rounded-md border border-border bg-background"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {service.name}
                </p>
                <p className="text-xs font-semibold text-[#FF9F1C]">
                  ${service.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() =>
                  setCustomServices(customServices.filter((_, idx) => idx !== i))
                }
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
            <Input
              placeholder="Service name"
              value={newCustom.name}
              onChange={(e) =>
                setNewCustom({ ...newCustom, name: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Price ($)"
              value={newCustom.price}
              onChange={(e) =>
                setNewCustom({ ...newCustom, price: e.target.value })
              }
              className="sm:w-32"
              min="0"
              step="0.01"
            />
            <Button
              variant="outline"
              onClick={addCustom}
              className="gap-1.5 border-[#FF9F1C] text-[#FF9F1C] hover:bg-[#FF9F1C]/10"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subcontractors */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Subcontractors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subcontractors.map((sub, i) => (
            <div
              key={i}
              className="flex items-start justify-between px-3 py-2.5 rounded-md border border-border bg-background"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{sub.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sub.workPerformed}
                </p>
                <p className="text-xs font-semibold text-[#0077B6] mt-0.5">
                  ${sub.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() =>
                  setSubcontractors(subcontractors.filter((_, idx) => idx !== i))
                }
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder="Subcontractor name"
                value={newSub.name}
                onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
              />
              <Input
                placeholder="Work performed"
                value={newSub.workPerformed}
                onChange={(e) =>
                  setNewSub({ ...newSub, workPerformed: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Price ($)"
                value={newSub.price}
                onChange={(e) =>
                  setNewSub({ ...newSub, price: e.target.value })
                }
                min="0"
                step="0.01"
              />
              <Button
                variant="outline"
                onClick={addSub}
                className="gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Running total estimate */}
      {jobInfo.vehicleWeight > 0 && (
        <Card className="card-elevated border-[#0077B6]/30">
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
              <span>Services subtotal</span>
              <span className="text-foreground font-medium">
                ${runningTotal.toFixed(2)}
              </span>
            </div>
            {customTotal > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <span>Custom services</span>
                <span className="text-foreground font-medium">
                  ${customTotal.toFixed(2)}
                </span>
              </div>
            )}
            {subTotal > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <span>Subcontractors</span>
                <span className="text-foreground font-medium">
                  ${subTotal.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Fuel surcharge ({jobInfo.fuelSurcharge}%)</span>
              <span className="text-foreground font-medium">
                ${fuelAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border font-bold text-base">
              <span className="text-foreground">Estimated Total</span>
              <span style={{ color: "#0077B6" }}>
                ${estimatedTotal.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setLocation("/new")}
          className="flex items-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleCalculate}
          className="flex-1 h-11 text-base font-semibold flex items-center justify-center gap-2"
          style={{ backgroundColor: "#0077B6" }}
        >
          <Calculator className="h-5 w-5" />
          Calculate Invoice
        </Button>
      </div>
    </div>
  );
}
