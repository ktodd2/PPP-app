import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import type { Job, TowingService, CompanySettings, User } from '@shared/schema';
import { X, Clock, Wrench, Building2, Crown, Upload, FileText, Truck } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onJobSelect?: (job: Job) => void;
}

export default function Sidebar({ isOpen, onClose, onJobSelect }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'services' | 'company'>('jobs');
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [localServiceRates, setLocalServiceRates] = useState<Record<number, string>>({});
  const [localCompanySettings, setLocalCompanySettings] = useState<Partial<CompanySettings>>({});
  const queryClient = useQueryClient();

  // Listen for job creation events to refresh recent jobs
  useEffect(() => {
    const handleJobCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/recent'] });
    };

    window.addEventListener('jobCreated', handleJobCreated);
    return () => window.removeEventListener('jobCreated', handleJobCreated);
  }, [queryClient]);

  // Fetch recent jobs
  const { data: recentJobs = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobs/recent'],
    enabled: activeTab === 'jobs'
  });

  // Fetch services for editing
  const { data: services = [] } = useQuery<TowingService[]>({
    queryKey: ['/api/services'],
    enabled: activeTab === 'services'
  });

  // Fetch company settings
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ['/api/company'],
    enabled: activeTab === 'company'
  });

  // Mutation for updating service rates
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, rate }: { id: number; rate: string }) => {
      const response = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rate })
      });
      if (!response.ok) throw new Error('Failed to update service rate');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
    }
  });

  // Mutation for updating company settings
  const updateCompanyMutation = useMutation({
    mutationFn: async (settings: Partial<CompanySettings>) => {
      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Failed to update company settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company'] });
    }
  });

  const handleServiceRateChange = (id: number, rate: string) => {
    setLocalServiceRates(prev => ({
      ...prev,
      [id]: rate
    }));
  };

  const handleServiceRateBlur = (id: number) => {
    const rate = localServiceRates[id];
    if (rate !== undefined) {
      updateServiceMutation.mutate({ id, rate });
      // Clear local state for this service after saving
      setLocalServiceRates(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const handleCompanySettingsChange = (field: string, value: string) => {
    setLocalCompanySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompanySettingsBlur = (field: string) => {
    const value = localCompanySettings[field as keyof CompanySettings];
    if (value !== undefined) {
      updateCompanyMutation.mutate({ [field]: value });
      // Clear local state for this field after saving
      setLocalCompanySettings(prev => {
        const newState = { ...prev };
        delete newState[field as keyof CompanySettings];
        return newState;
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await fetch('/api/company/logo', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Logo uploaded successfully:', result);
        queryClient.invalidateQueries({ queryKey: ['/api/company'] });
      } else {
        const error = await response.text();
        console.error('Failed to upload logo:', error);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
    }
    
    // Clear the input
    event.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="relative bg-background w-80 h-full shadow-2xl overflow-hidden flex flex-col border-l border-white/10">
        {/* Header */}
        <div className="header-gradient text-foreground p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 bg-white/5 border-b border-white/10">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 py-2.5 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'jobs'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Jobs
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-2.5 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'services'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            Rates
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`flex-1 py-2.5 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'company'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Company
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Admin Button - only show for admin users */}
          {user?.role === 'admin' && (
            <div className="mb-4">
              <button
                onClick={() => {
                  setLocation('/admin');
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-accent to-accent/80 text-white py-3 px-4 rounded-xl hover:opacity-90 transition-all font-semibold shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
              >
                <Crown className="h-5 w-5" />
                Admin Dashboard
              </button>
            </div>
          )}

          {/* Recent Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-3">
              {recentJobs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-block p-3 bg-white/5 rounded-xl mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">No recent jobs found</p>
                </div>
              ) : (
                recentJobs.map(job => (
                  <div
                    key={job.id}
                    className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-all group"
                    onClick={() => {
                      if (onJobSelect) {
                        onJobSelect(job);
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">#{job.invoiceNumber}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="font-medium text-foreground text-sm mb-1">{job.customerName}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Truck className="h-3 w-3" />
                      {job.vehicleType}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Service Rates Tab */}
          {activeTab === 'services' && (
            <div className="space-y-3">
              {services.map(service => (
                <div key={service.id} className="glass-card rounded-xl p-4">
                  <div className="font-medium text-foreground text-sm mb-3">
                    {service.name}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.1"
                      value={localServiceRates[service.id] ?? service.rate}
                      onChange={(e) => handleServiceRateChange(service.id, e.target.value)}
                      onBlur={() => handleServiceRateBlur(service.id)}
                      className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <span className="text-xs text-muted-foreground font-medium">¢ per lb</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Company Settings Tab */}
          {activeTab === 'company' && companySettings && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  type="text"
                  value={localCompanySettings.companyName ?? companySettings.companyName}
                  onChange={(e) => handleCompanySettingsChange('companyName', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('companyName')}
                  className="input-modern text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={localCompanySettings.companySubtitle ?? companySettings.companySubtitle}
                  onChange={(e) => handleCompanySettingsChange('companySubtitle', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('companySubtitle')}
                  className="input-modern text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Company Logo
                </label>
                <div className="space-y-3">
                  {companySettings.companyLogo && companySettings.companyLogo.startsWith('/uploads/') && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <img
                        src={companySettings.companyLogo}
                        alt="Company Logo"
                        className="w-12 h-12 object-contain rounded-lg"
                      />
                      <span className="text-xs text-muted-foreground">Current logo</span>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 hover:border-white/30 transition-all">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-muted-foreground text-center">JPG, PNG, GIF, or WebP (max 5MB)</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Address
                </label>
                <input
                  type="text"
                  value={localCompanySettings.address ?? companySettings.address ?? ''}
                  onChange={(e) => handleCompanySettingsChange('address', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('address')}
                  className="input-modern text-sm"
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Phone
                </label>
                <input
                  type="text"
                  value={localCompanySettings.phone ?? companySettings.phone ?? ''}
                  onChange={(e) => handleCompanySettingsChange('phone', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('phone')}
                  className="input-modern text-sm"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={localCompanySettings.email ?? companySettings.email ?? ''}
                  onChange={(e) => handleCompanySettingsChange('email', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('email')}
                  className="input-modern text-sm"
                  placeholder="info@yourtowing.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Invoice Footer
                </label>
                <textarea
                  value={localCompanySettings.invoiceFooter ?? companySettings.invoiceFooter ?? ''}
                  onChange={(e) => handleCompanySettingsChange('invoiceFooter', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('invoiceFooter')}
                  className="input-modern text-sm resize-none"
                  rows={3}
                  placeholder="Thank you for your business!"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
