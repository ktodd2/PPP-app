import { useState } from 'react';
import { useLocation } from 'wouter';
import type { JobInfo } from '@/lib/invoice';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface HomePageProps {
  jobInfo: JobInfo;
  setJobInfo: (jobInfo: JobInfo) => void;
  selectedPhotos?: File[];
  setSelectedPhotos?: (photos: File[]) => void;
}

export default function HomePage({ jobInfo, setJobInfo, selectedPhotos = [], setSelectedPhotos }: HomePageProps) {
  const [, setLocation] = useLocation();

  const handleInputChange = (field: keyof JobInfo, value: string | number) => {
    setJobInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (setSelectedPhotos) {
      setSelectedPhotos([...selectedPhotos, ...files]);
    }
  };

  const removePhoto = (index: number) => {
    if (setSelectedPhotos) {
      setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index));
    }
  };

  const handleNext = () => {
    setLocation('/services');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="text-6xl mb-4">🚛</div>
          <h1 className="text-3xl font-bold text-white mb-2">Towing Billing</h1>
          <p className="text-blue-100">Professional Invoice Generator</p>
        </div>

        {/* Job Info Card */}
        <div className="bg-white rounded-3xl p-6 mb-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Job Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <input
                type="text"
                value={jobInfo.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
              <input
                type="text"
                value={jobInfo.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                placeholder="Enter invoice number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
              <input
                type="text"
                value={jobInfo.vehicleType}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                placeholder="e.g., Freightliner Cascadia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Weight (lbs)</label>
              <input
                type="number"
                value={jobInfo.vehicleWeight || ''}
                onChange={(e) => handleInputChange('vehicleWeight', parseInt(e.target.value) || 0)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                placeholder="Enter weight in pounds"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Problem Description</label>
              <input
                type="text"
                value={jobInfo.problemDescription}
                onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                placeholder="e.g., Rollover, Collision"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Surcharge (%)</label>
              <input
                type="number"
                value={jobInfo.fuelSurcharge}
                onChange={(e) => handleInputChange('fuelSurcharge', parseFloat(e.target.value) || 15)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                placeholder="15"
              />
            </div>

            {/* Photo Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera className="inline mr-2 h-4 w-4" />
                Job Photos (Optional)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoSelect}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              
              {/* Photo Preview Grid */}
              {selectedPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Job photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="w-full bg-white text-blue-600 font-bold py-4 px-6 rounded-2xl text-lg shadow-lg active:scale-95 transition-transform"
        >
          Select Services →
        </button>
      </div>
    </div>
  );
}
