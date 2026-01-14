import { useState } from 'react';
import { useLocation } from 'wouter';
import type { JobInfo } from '@/lib/invoice';
import { Camera, X, Truck, FileText, Scale, Fuel, User, ArrowRight, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-background p-4 pb-8">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="max-w-lg mx-auto relative">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <div className="relative inline-block">
            <div className="glass-card rounded-3xl px-10 py-8 gradient-border">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-2.5 bg-primary/20 rounded-xl">
                  <Truck className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-5xl font-black tracking-tight gradient-text">PPP</h1>
              </div>
              <h2 className="text-lg font-medium text-primary/90 tracking-wide mb-1">Price per Pound</h2>
              <h3 className="text-sm text-muted-foreground font-light flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                Invoice Wizard
              </h3>
            </div>
          </div>
        </div>

        {/* Job Info Card */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Job Information</h2>
          </div>

          <div className="space-y-5">
            {/* Photo Upload Section */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <label className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-primary/20 rounded-lg mt-0.5">
                  <Camera className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="block text-sm font-medium text-foreground">Job Photos</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Document the job site and vehicle condition
                  </span>
                </div>
              </label>

              <div className="flex gap-3 mb-4">
                <label className="cursor-pointer bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-5 py-3 rounded-xl hover:opacity-90 transition-all inline-flex items-center gap-2 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]">
                  <Camera className="h-4 w-4" />
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
                  <span className="text-sm text-primary flex items-center px-4 bg-primary/10 rounded-xl font-medium border border-primary/20">
                    {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {selectedPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="photo-grid-item group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Job photo ${index + 1}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-destructive/90 backdrop-blur-sm text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/90 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Customer Name
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="input-modern"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  className="input-modern"
                  placeholder="Enter invoice number"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  Vehicle Type
                </label>
                <input
                  type="text"
                  value={formData.vehicleType}
                  onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                  className="input-modern"
                  placeholder="e.g., Freightliner Cascadia"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  Vehicle Weight (lbs)
                </label>
                <input
                  type="number"
                  value={formData.vehicleWeight || ''}
                  onChange={(e) => handleInputChange('vehicleWeight', parseInt(e.target.value) || 0)}
                  className="input-modern"
                  placeholder="Enter weight in pounds"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Description of Work
                </label>
                <input
                  type="text"
                  value={formData.problemDescription}
                  onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                  className="input-modern"
                  placeholder="e.g., Rollover recovery, Vehicle extraction"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  Fuel Surcharge (%)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.fuelSurcharge}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      handleInputChange('fuelSurcharge', value === '' ? 0 : parseFloat(value) || 0);
                    }
                  }}
                  className="input-modern"
                  placeholder="15"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold py-4 px-6 rounded-2xl text-lg btn-modern flex items-center justify-center gap-2 group"
        >
          Select Services
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
