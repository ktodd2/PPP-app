import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import type { JobInfo } from '@/lib/invoice';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface HomePageProps {
  jobInfo: JobInfo;
  setJobInfo: (jobInfo: JobInfo) => void;
  selectedPhotos?: File[];
  setSelectedPhotos?: (photos: File[]) => void;
}

const jobInfoSchema = z.object({
  customerName: z.string(),
  invoiceNumber: z.string(),
  vehicleType: z.string(),
  vehicleWeight: z.number().min(0),
  problemDescription: z.string(),
  fuelSurcharge: z.number().min(0).max(100),
});

export default function HomePage({ jobInfo, setJobInfo, selectedPhotos = [], setSelectedPhotos }: HomePageProps) {
  const [, setLocation] = useLocation();
  
  const form = useForm<JobInfo>({
    resolver: zodResolver(jobInfoSchema),
    defaultValues: jobInfo,
    mode: 'onChange',
  });

  // Watch form values and update parent state
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (data.customerName !== undefined) {
        setJobInfo(data as JobInfo);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, setJobInfo]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 mb-6">
            <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">PPP</h1>
            <h2 className="text-xl font-medium text-blue-100 mb-2 tracking-wide">(Price per Pound)</h2>
            <h3 className="text-lg text-blue-200 font-light">Invoice Wizard</h3>
          </div>
        </div>

        {/* Job Info Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 mb-6 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6 border-b border-slate-200 pb-3">Job Information</h2>
          
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-2">Customer Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                        placeholder="Enter customer name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                        placeholder="Enter invoice number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                        placeholder="e.g., Freightliner Cascadia"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-2">Vehicle Weight (lbs)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                        placeholder="Enter weight in pounds"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="problemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-2">Description of Recovery and Work Performed</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                        placeholder="e.g., Rollover recovery, Vehicle extraction"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuelSurcharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-2">Fuel Surcharge (%)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                        placeholder="15"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Camera className="inline mr-2 h-4 w-4" />
                  Job Photos (Optional)
                </label>
                
                {/* Upload Button */}
                <div className="flex gap-2 mb-3">
                  <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2">
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
                    <span className="text-sm text-gray-600 flex items-center">
                      {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>
                
                {/* Photo Preview Grid */}
                {selectedPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Job photo ${index + 1}`}
                          className="w-full h-16 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg opacity-75 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Form>
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
