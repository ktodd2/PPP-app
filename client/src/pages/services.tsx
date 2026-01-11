import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import type { JobInfo } from '@/lib/invoice';
import type { TowingService } from '@/lib/services';
import { Plus, X } from 'lucide-react';

interface CustomService {
  name: string;
  price: number;
}

interface ServicesPageProps {
  selectedServices: Record<number, boolean>;
  setSelectedServices: (services: Record<number, boolean>) => void;
  subcontractors: Array<{name: string; workPerformed: string; price: number}>;
  setSubcontractors: (subcontractors: Array<{name: string; workPerformed: string; price: number}>) => void;
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
  onCalculateInvoice 
}: ServicesPageProps) {
  const [, setLocation] = useLocation();
  const [newSubcontractor, setNewSubcontractor] = useState({
    name: '',
    workPerformed: '',
    price: ''
  });

  const [newCustomService, setNewCustomService] = useState({
    name: '',
    price: ''
  });

  // Fetch services from database
  const { data: services = [], isLoading, error } = useQuery<TowingService[]>({
    queryKey: ['/api/services'],
  });

  const toggleService = (serviceId: number) => {
    setSelectedServices({
      ...selectedServices,
      [serviceId]: !selectedServices[serviceId]
    });
  };

  const addSubcontractor = () => {
    if (newSubcontractor.name && newSubcontractor.workPerformed && newSubcontractor.price) {
      setSubcontractors([
        ...subcontractors,
        {
          name: newSubcontractor.name,
          workPerformed: newSubcontractor.workPerformed,
          price: parseFloat(newSubcontractor.price)
        }
      ]);
      setNewSubcontractor({ name: '', workPerformed: '', price: '' });
    }
  };

  const removeSubcontractor = (index: number) => {
    setSubcontractors(subcontractors.filter((_, i) => i !== index));
  };

  const addCustomService = () => {
    if (newCustomService.name.trim() && newCustomService.price) {
      const price = parseFloat(newCustomService.price);
      if (!isNaN(price) && price > 0) {
        setCustomServices([...customServices, { 
          name: newCustomService.name.trim(), 
          price 
        }]);
        setNewCustomService({ name: '', price: '' });
      }
    }
  };

  const removeCustomService = (index: number) => {
    setCustomServices(customServices.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    setLocation('/');
  };

  const handleNext = () => {
    const selectedServicesList = services.filter(service => selectedServices[service.id]);
    
    if (selectedServicesList.length === 0 || !jobInfo.vehicleWeight) {
      alert('Please select at least one service and ensure vehicle weight is entered.');
      return;
    }

    onCalculateInvoice();
    setLocation('/invoice');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">PPP Invoice Wizard</h1>
          <p className="text-blue-100">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-600 mb-4">Error loading services</p>
          <button
            onClick={() => setLocation('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-foreground p-6 sticky top-0 z-10 shadow-xl border-b border-border">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={handleBack} className="text-2xl hover:text-primary transition-colors">←</button>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">PPP Invoice Wizard</h1>
            <p className="text-sm text-primary font-light">Select Services</p>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Services List */}
        <div className="space-y-3 mb-6">
          {services.map(service => {
            const isSelected = selectedServices[service.id] || false;
            return (
              <div key={service.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <h3 className="font-medium text-foreground text-sm leading-tight mb-1">
                      {service.name}
                    </h3>
                    <p className="text-primary font-bold text-sm">
                      {parseFloat(service.rate as string).toFixed(1)}¢ per lb
                    </p>
                  </div>
                  <button
                    onClick={() => toggleService(service.id)}
                    className={`service-toggle px-6 py-3 rounded-xl font-bold text-sm min-w-16 shadow-lg transition-all ${
                      isSelected 
                        ? 'bg-green-600 text-white hover:bg-green-500' 
                        : 'bg-red-600 text-white hover:bg-red-500'
                    }`}
                  >
                    {isSelected ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Services Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Custom Services</h2>
          
          {/* Existing Custom Services */}
          {customServices.length > 0 && (
            <div className="space-y-3 mb-4">
              {customServices.map((service, index) => (
                <div key={index} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground text-sm mb-1">{service.name}</h3>
                      <p className="text-sm font-bold text-primary">${service.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeCustomService(index)}
                      className="text-destructive hover:text-destructive/80 p-1 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Custom Service */}
          <div className="glass-card rounded-2xl p-4">
            <h3 className="font-medium text-foreground text-sm mb-3">Add Custom Service</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Service name"
                value={newCustomService.name}
                onChange={(e) => setNewCustomService({...newCustomService, name: e.target.value})}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price ($)"
                value={newCustomService.price}
                onChange={(e) => setNewCustomService({...newCustomService, price: e.target.value})}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <button
                onClick={addCustomService}
                className="w-full bg-primary text-primary-foreground font-medium py-2 px-4 rounded-lg text-sm hover:bg-primary/90 transition-colors flex items-center justify-center shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Service
              </button>
            </div>
          </div>
        </div>

        {/* Subcontractors Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Subcontractors</h2>
          
          {/* Existing Subcontractors */}
          {subcontractors.length > 0 && (
            <div className="space-y-3 mb-4">
              {subcontractors.map((sub, index) => (
                <div key={index} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground text-sm mb-1">{sub.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{sub.workPerformed}</p>
                      <p className="text-sm font-bold text-primary">${sub.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeSubcontractor(index)}
                      className="text-destructive hover:text-destructive/80 p-1 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Subcontractor */}
          <div className="glass-card rounded-2xl p-4">
            <h3 className="font-medium text-foreground text-sm mb-3">Add Subcontractor</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Subcontractor name"
                value={newSubcontractor.name}
                onChange={(e) => setNewSubcontractor({...newSubcontractor, name: e.target.value})}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <input
                type="text"
                placeholder="Work performed"
                value={newSubcontractor.workPerformed}
                onChange={(e) => setNewSubcontractor({...newSubcontractor, workPerformed: e.target.value})}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price ($)"
                value={newSubcontractor.price}
                onChange={(e) => setNewSubcontractor({...newSubcontractor, price: e.target.value})}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <button
                onClick={addSubcontractor}
                className="w-full bg-green-600 text-white font-medium py-2 px-4 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center justify-center shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Subcontractor
              </button>
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleNext}
          className="w-full bg-primary text-primary-foreground font-bold py-4 px-6 rounded-2xl text-lg shadow-2xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all"
        >
          Calculate Invoice
        </button>
      </div>
    </div>
  );
}
