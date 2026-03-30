import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useAuthQuery } from "@/hooks/use-auth-query";
import { supabase } from "@/lib/supabase";
import { fetchWithAuth } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Building2, DollarSign, User } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CompanySettings {
  name: string;
  subtitle: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoPath: string;
  defaultFuelSurcharge: number;
  invoiceFooter: string;
}

interface Service {
  id: number;
  name: string;
  baseRate: string;
}

// ─── Company Info Tab ────────────────────────────────────────────────────────

function CompanyInfoTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: company, isLoading } = useAuthQuery<CompanySettings>(
    ["/api/company"]
  );

  const [form, setForm] = useState<CompanySettings>({
    name: "",
    subtitle: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logoPath: "",
    defaultFuelSurcharge: 15,
    invoiceFooter: "",
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? "",
        subtitle: company.subtitle ?? "",
        address: company.address ?? "",
        phone: company.phone ?? "",
        email: company.email ?? "",
        website: company.website ?? "",
        logoPath: company.logoPath ?? "",
        defaultFuelSurcharge: company.defaultFuelSurcharge ?? 15,
        invoiceFooter: company.invoiceFooter ?? "",
      });
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: async (data: CompanySettings) => {
      await fetchWithAuth("/api/company", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/company"] });
      toast({ title: "Company settings saved" });
    },
    onError: (err: Error) => {
      toast({
        title: "Save failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logos/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("company-assets")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      await fetchWithAuth("/api/company/logo", {
        method: "POST",
        body: JSON.stringify({ path }),
      });
      setForm((f) => ({ ...f, logoPath: path }));
      qc.invalidateQueries({ queryKey: ["/api/company"] });
      toast({ title: "Logo uploaded" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleChange = (
    field: keyof CompanySettings,
    value: string | number
  ) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        Loading company settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="space-y-2">
        <Label>Company Logo</Label>
        <div className="flex items-center gap-4">
          {form.logoPath && (
            <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
              <img
                src={
                  supabase.storage
                    .from("company-assets")
                    .getPublicUrl(form.logoPath).data.publicUrl
                }
                alt="Company logo"
                className="h-full w-full object-contain"
              />
            </div>
          )}
          <label className="cursor-pointer">
            <span className="inline-flex items-center px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground bg-background hover:bg-muted transition-colors">
              {uploading ? "Uploading..." : "Upload Logo"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="co-name">Company Name</Label>
          <Input
            id="co-name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-subtitle">Subtitle / Tagline</Label>
          <Input
            id="co-subtitle"
            value={form.subtitle}
            onChange={(e) => handleChange("subtitle", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="co-address">Address</Label>
          <Input
            id="co-address"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-phone">Phone</Label>
          <Input
            id="co-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-email">Email</Label>
          <Input
            id="co-email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-website">Website</Label>
          <Input
            id="co-website"
            type="url"
            value={form.website}
            onChange={(e) => handleChange("website", e.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-fuel">Default Fuel Surcharge (%)</Label>
          <Input
            id="co-fuel"
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={form.defaultFuelSurcharge}
            onChange={(e) =>
              handleChange(
                "defaultFuelSurcharge",
                parseFloat(e.target.value) || 0
              )
            }
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="co-footer">Invoice Footer Text</Label>
          <Input
            id="co-footer"
            value={form.invoiceFooter}
            onChange={(e) => handleChange("invoiceFooter", e.target.value)}
            placeholder="e.g., Thank you for your business!"
          />
        </div>
      </div>

      <Button
        onClick={() => saveMutation.mutate(form)}
        disabled={saveMutation.isPending}
        style={{ backgroundColor: "#0077B6" }}
        className="font-semibold"
      >
        {saveMutation.isPending ? "Saving..." : "Save Company Info"}
      </Button>
    </div>
  );
}

// ─── Service Rates Tab ───────────────────────────────────────────────────────

function ServiceRatesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: services = [], isLoading } = useAuthQuery<Service[]>(
    ["/api/services"]
  );

  const [rates, setRates] = useState<Record<number, string>>({});

  useEffect(() => {
    if (services.length > 0) {
      const initial: Record<number, string> = {};
      services.forEach((s) => {
        initial[s.id] = s.baseRate;
      });
      setRates(initial);
    }
  }, [services]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, rate }: { id: number; rate: string }) => {
      await fetchWithAuth(`/api/services/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ baseRate: rate }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Rate updated" });
    },
    onError: (err: Error) => {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleBlur = (id: number) => {
    const current = services.find((s) => s.id === id);
    if (current && rates[id] !== current.baseRate) {
      updateMutation.mutate({ id, rate: rates[id] });
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        Loading service rates...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">
        Edit rates inline. Changes save automatically when you leave the field.
      </p>
      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/40 transition-colors"
          >
            <span className="text-sm font-medium text-foreground flex-1 pr-4">
              {service.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={rates[service.id] ?? service.baseRate}
                onChange={(e) =>
                  setRates((r) => ({ ...r, [service.id]: e.target.value }))
                }
                onBlur={() => handleBlur(service.id)}
                className="w-28 text-right"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Account Tab ─────────────────────────────────────────────────────────────

function AccountTab() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await fetchWithAuth("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ displayName }),
      });
      qc.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Display name updated" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update name";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast({ title: "Password updated" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update password";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-8 max-w-md">
      {/* Profile info */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Profile</h3>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md border border-border">
            {user?.email ?? "—"}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="display-name">Display Name</Label>
          <div className="flex gap-2">
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
            <Button
              onClick={handleSaveName}
              disabled={savingName}
              style={{ backgroundColor: "#0077B6" }}
              className="font-semibold flex-shrink-0"
            >
              {savingName ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">
          Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
          <Button
            type="submit"
            disabled={savingPassword || !newPassword || !confirmPassword}
            variant="outline"
            className="font-semibold"
          >
            {savingPassword ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>

      {/* Sign out */}
      <div className="pt-2 border-t border-border">
        <Button
          variant="destructive"
          onClick={handleSignOut}
          disabled={signingOut}
          className="font-semibold"
        >
          {signingOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" style={{ color: "#0077B6" }} />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your company, services, and account
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="company">
          <TabsList className="mb-6">
            <TabsTrigger value="company" className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Company Info</span>
              <span className="sm:hidden">Company</span>
            </TabsTrigger>
            <TabsTrigger value="rates" className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Service Rates</span>
              <span className="sm:hidden">Rates</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <TabsContent value="company" className="mt-0">
                <CompanyInfoTab />
              </TabsContent>
              <TabsContent value="rates" className="mt-0">
                <ServiceRatesTab />
              </TabsContent>
              <TabsContent value="account" className="mt-0">
                <AccountTab />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
