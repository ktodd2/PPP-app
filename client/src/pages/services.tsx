import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import type { JobInfo } from '@/lib/invoice';
import type { TowingService } from '@/lib/services';

interface ServicesPageProps {
  selectedServices: Record<number, boolean>;
  setSelectedServices: (services: Record<number, boolean>) => void;
  jobInfo: JobInfo;
  onCalculateInvoice: () => void;
}

export default function ServicesPage({ 
  selectedServices, 
  setSelectedServices, 
  jobInfo,
  onCalculateInvoice 
}: ServicesPageProps) {
  const [, setLocation] = useLocation();

  const toggleService = (serviceId: number) => {
    setSelectedServices({
      ...selectedServices,
      [serviceId]: !selectedServices[serviceId]
    });
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={handleBack} className="text-2xl">←</button>
          <h1 className="text-xl font-bold">Select Services</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Services List */}
        <div className="space-y-3 mb-6">
          {services.map(service => {
            const isSelected = selectedServices[service.id] || false;
            return (
              <div key={service.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <h3 className="font-medium text-gray-800 text-sm leading-tight mb-1">
                      {service.name}
                    </h3>
                    <p className="text-green-600 font-bold text-sm">
                      {service.rate.toFixed(1)}¢ per lb
                    </p>
                  </div>
                  <button
                    onClick={() => toggleService(service.id)}
                    className={`service-toggle px-6 py-3 rounded-xl font-bold text-sm min-w-16 ${
                      isSelected 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {isSelected ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleNext}
          className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg active:scale-95 transition-transform"
        >
          Calculate Invoice
        </button>
      </div>
    </div>
  );
}
