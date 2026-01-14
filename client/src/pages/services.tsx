import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import type { JobInfo } from '@/lib/invoice';
import type { TowingService } from '@/lib/services';
import { Plus, X, ChevronLeft, Wrench, Users, Calculator, Check, Sparkles } from 'lucide-react';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 bg-primary/20 rounded-2xl mb-4 animate-pulse">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Loading Services</h1>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 bg-destructive/20 rounded-2xl mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-foreground font-medium mb-4">Error loading services</p>
          <button
            onClick={() => setLocation('/')}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const selectedCount = Object.values(selectedServices).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      {/* Header */}
      <div className="header-gradient text-foreground p-5 sticky top-0 z-10 shadow-xl border-b border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight">Select Services</h1>
            <p className="text-xs text-primary font-medium">
              {selectedCount} service{selectedCount !== 1 ? 's' : ''} selected
            </p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 relative">
        {/* Services List */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-primary/20 rounded-lg">
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Available Services</h2>
          </div>

          {services.map(service => {
            const isSelected = selectedServices[service.id] || false;
            return (
              <div
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`service-card cursor-pointer ${isSelected ? 'border-success/50 bg-success/5' : ''}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm leading-tight mb-1 truncate">
                      {service.name}
                    </h3>
                    <p className="text-primary font-semibold text-sm">
                      {parseFloat(service.rate as string).toFixed(1)}¢/lb
                    </p>
                  </div>

                  {/* Modern Toggle Switch */}
                  <div className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                    isSelected
                      ? 'bg-success shadow-lg shadow-success/30'
                      : 'bg-white/10'
                  }`}>
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                      isSelected ? 'left-7' : 'left-1'
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5 text-success" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Services Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-accent/20 rounded-lg">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Custom Services</h2>
          </div>

          {customServices.length > 0 && (
            <div className="space-y-3 mb-4">
              {customServices.map((service, index) => (
                <div key={index} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground text-sm mb-1">{service.name}</h3>
                      <p className="text-sm font-semibold text-primary">${service.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeCustomService(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="glass-card rounded-2xl p-5">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Service name"
                value={newCustomService.name}
                onChange={(e) => setNewCustomService({...newCustomService, name: e.target.value})}
                className="input-modern text-sm"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price ($)"
                value={newCustomService.price}
                onChange={(e) => setNewCustomService({...newCustomService, price: e.target.value})}
                className="input-modern text-sm"
              />
              <button
                onClick={addCustomService}
                className="w-full bg-accent/20 hover:bg-accent/30 text-accent-foreground font-medium py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center border border-accent/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Service
              </button>
            </div>
          </div>
        </div>

        {/* Subcontractors Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-warning/20 rounded-lg">
              <Users className="h-4 w-4 text-warning" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Subcontractors</h2>
          </div>

          {subcontractors.length > 0 && (
            <div className="space-y-3 mb-4">
              {subcontractors.map((sub, index) => (
                <div key={index} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground text-sm mb-1">{sub.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{sub.workPerformed}</p>
                      <p className="text-sm font-semibold text-primary">${sub.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeSubcontractor(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="glass-card rounded-2xl p-5">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Subcontractor name"
                value={newSubcontractor.name}
                onChange={(e) => setNewSubcontractor({...newSubcontractor, name: e.target.value})}
                className="input-modern text-sm"
              />
              <input
                type="text"
                placeholder="Work performed"
                value={newSubcontractor.workPerformed}
                onChange={(e) => setNewSubcontractor({...newSubcontractor, workPerformed: e.target.value})}
                className="input-modern text-sm"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price ($)"
                value={newSubcontractor.price}
                onChange={(e) => setNewSubcontractor({...newSubcontractor, price: e.target.value})}
                className="input-modern text-sm"
              />
              <button
                onClick={addSubcontractor}
                className="w-full bg-warning/20 hover:bg-warning/30 text-warning font-medium py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center border border-warning/30"
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
          className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold py-4 px-6 rounded-2xl text-lg btn-modern flex items-center justify-center gap-2 group"
        >
          <Calculator className="h-5 w-5" />
          Calculate Invoice
        </button>
      </div>
    </div>
  );
}
