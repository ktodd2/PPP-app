import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Job, TowingService, CompanySettings } from '@shared/schema';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onJobSelect?: (job: Job) => void;
}

export default function Sidebar({ isOpen, onClose, onJobSelect }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'services' | 'company'>('jobs');
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
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="relative bg-white w-80 h-full shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Settings</h2>
          <button 
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-lg p-2"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'jobs' 
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Recent Jobs
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'services' 
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Service Rates
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'company' 
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Company
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Recent Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 mb-4">Recent Jobs</h3>
              {recentJobs.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent jobs found</p>
              ) : (
                recentJobs.map(job => (
                  <div 
                    key={job.id} 
                    className="bg-gray-50 rounded-lg p-3 border cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    onClick={() => {
                      if (onJobSelect) {
                        onJobSelect(job);
                        onClose();
                      }
                    }}
                  >
                    <div className="font-medium text-gray-800">#{job.invoiceNumber}</div>
                    <div className="text-sm text-gray-600">{job.customerName}</div>
                    <div className="text-sm text-gray-500">{job.vehicleType}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Service Rates Tab */}
          {activeTab === 'services' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 mb-4">Service Rates</h3>
              {services.map(service => (
                <div key={service.id} className="bg-gray-50 rounded-lg p-3 border">
                  <div className="font-medium text-gray-800 text-sm mb-2">
                    {service.name}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      value={localServiceRates[service.id] ?? service.rate}
                      onChange={(e) => handleServiceRateChange(service.id, e.target.value)}
                      onBlur={() => handleServiceRateBlur(service.id)}
                      className="w-20 px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">¢ per lb</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Company Settings Tab */}
          {activeTab === 'company' && companySettings && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 mb-4">Company Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={localCompanySettings.companyName ?? companySettings.companyName}
                  onChange={(e) => handleCompanySettingsChange('companyName', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('companyName')}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={localCompanySettings.companySubtitle ?? companySettings.companySubtitle}
                  onChange={(e) => handleCompanySettingsChange('companySubtitle', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('companySubtitle')}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Logo
                </label>
                <div className="space-y-2">
                  {companySettings.companyLogo && companySettings.companyLogo.startsWith('/uploads/') && (
                    <div className="flex items-center space-x-2">
                      <img 
                        src={companySettings.companyLogo} 
                        alt="Company Logo" 
                        className="w-12 h-12 object-contain border rounded"
                      />
                      <span className="text-sm text-gray-600">Current logo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <p className="text-xs text-gray-500">Upload JPG, PNG, GIF, or WebP (max 5MB)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Fuel Surcharge (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={localCompanySettings.defaultFuelSurcharge ?? companySettings.defaultFuelSurcharge}
                  onChange={(e) => handleCompanySettingsChange('defaultFuelSurcharge', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('defaultFuelSurcharge')}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={localCompanySettings.address ?? companySettings.address ?? ''}
                  onChange={(e) => handleCompanySettingsChange('address', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('address')}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={localCompanySettings.phone ?? companySettings.phone ?? ''}
                  onChange={(e) => handleCompanySettingsChange('phone', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('phone')}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={localCompanySettings.email ?? companySettings.email ?? ''}
                  onChange={(e) => handleCompanySettingsChange('email', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('email')}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="info@yourtowing.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Footer
                </label>
                <textarea
                  value={localCompanySettings.invoiceFooter ?? companySettings.invoiceFooter ?? ''}
                  onChange={(e) => handleCompanySettingsChange('invoiceFooter', e.target.value)}
                  onBlur={() => handleCompanySettingsBlur('invoiceFooter')}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
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