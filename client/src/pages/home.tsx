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
  
  // Local form state to prevent re-render issues
  const [formData, setFormData] = useState({
    customerName: jobInfo.customerName,
    invoiceNumber: jobInfo.invoiceNumber,
    vehicleType: jobInfo.vehicleType,
    vehicleWeight: jobInfo.vehicleWeight,
    problemDescription: jobInfo.problemDescription,
    fuelSurcharge: jobInfo.fuelSurcharge
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          const resizedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(resizedFile);
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const processedFiles: File[] = [];
    
    for (const file of files) {
      // Check file size (limit to 5MB original)
      if (file.size > 5 * 1024 * 1024) {
        console.warn(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB), skipping`);
        continue;
      }
      
      try {
        // Resize image to ensure it works in PDF
        const resizedFile = await resizeImage(file);
        processedFiles.push(resizedFile);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
    }
    
    if (setSelectedPhotos && processedFiles.length > 0) {
      setSelectedPhotos([...selectedPhotos, ...processedFiles]);
    }
    
    // Clear the input so the same file can be selected again or to allow adding more photos on mobile
    event.target.value = '';
  };

  const removePhoto = (index: number) => {
    if (setSelectedPhotos) {
      setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index));
    }
  };

  const handleNext = () => {
    // Update parent state with form data before navigating
    setJobInfo({
      ...jobInfo,
      ...formData
    });
    setLocation('/services');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-block glass-card rounded-2xl px-8 py-6 mb-6">
            <h1 className="text-5xl font-bold text-foreground mb-3 tracking-tight">PPP</h1>
            <h2 className="text-xl font-medium text-primary mb-2 tracking-wide">(Price per Pound)</h2>
            <h3 className="text-lg text-muted-foreground font-light">Invoice Wizard</h3>
          </div>
        </div>

        {/* Job Info Card */}
        <div className="glass-card rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-6 border-b border-border pb-3">Job Information</h2>
          
          <div className="space-y-4">
            {/* Photo Upload Section - Enhanced */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <label className="block text-sm font-medium text-foreground mb-3">
                <Camera className="inline mr-2 h-5 w-5 text-primary" />
                Job Photos (Optional)
                <span className="block text-xs text-muted-foreground mt-1">
                  Add photos to document the job site and vehicle condition
                </span>
              </label>
              
              {/* Upload Button */}
              <div className="flex gap-2 mb-4">
                <label className="cursor-pointer bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 transition-all inline-flex items-center gap-2 font-medium shadow-lg hover:shadow-xl active:scale-95">
                  <Camera className="h-5 w-5" />
                  Add Photos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                {selectedPhotos.length > 0 && (
                  <span className="text-sm text-muted-foreground flex items-center px-3 bg-accent rounded-lg font-medium">
                    {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              
              {/* Photo Preview Grid - Enhanced */}
              {selectedPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="photo-grid-item">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Job photo ${index + 1}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <span className="absolute bottom-2 left-2 text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Photo {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Customer Name</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className="w-full p-4 bg-input border-2 border-border rounded-xl focus:border-primary focus:outline-none text-lg text-foreground placeholder:text-muted-foreground transition-colors"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Invoice Number</label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                className="w-full p-4 bg-input border-2 border-border rounded-xl focus:border-primary focus:outline-none text-lg text-foreground placeholder:text-muted-foreground transition-colors"
                placeholder="Enter invoice number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Vehicle Type</label>
              <input
                type="text"
                value={formData.vehicleType}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                className="w-full p-4 bg-input border-2 border-border rounded-xl focus:border-primary focus:outline-none text-lg text-foreground placeholder:text-muted-foreground transition-colors"
                placeholder="e.g., Freightliner Cascadia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Vehicle Weight (lbs)</label>
              <input
                type="number"
                value={formData.vehicleWeight || ''}
                onChange={(e) => handleInputChange('vehicleWeight', parseInt(e.target.value) || 0)}
                className="w-full p-4 bg-input border-2 border-border rounded-xl focus:border-primary focus:outline-none text-lg text-foreground placeholder:text-muted-foreground transition-colors"
                placeholder="Enter weight in pounds"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description of Recovery and Work Performed</label>
              <input
                type="text"
                value={formData.problemDescription}
                onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                className="w-full p-4 bg-input border-2 border-border rounded-xl focus:border-primary focus:outline-none text-lg text-foreground placeholder:text-muted-foreground transition-colors"
                placeholder="e.g., Rollover recovery, Vehicle extraction"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Fuel Surcharge (%)</label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.fuelSurcharge}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string, numbers, and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleInputChange('fuelSurcharge', value === '' ? 0 : parseFloat(value) || 0);
                  }
                }}
                className="w-full p-4 bg-input border-2 border-border rounded-xl focus:border-primary focus:outline-none text-lg text-foreground placeholder:text-muted-foreground transition-colors"
                placeholder="15"
              />
            </div>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="w-full bg-primary text-primary-foreground font-bold py-4 px-6 rounded-2xl text-lg shadow-2xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all"
        >
          Select Services →
        </button>
      </div>
    </div>
  );
}
