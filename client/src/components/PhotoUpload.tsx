import { useRef } from "react";
import { Camera, X } from "lucide-react";

const MAX_PHOTOS = 20;
const RESIZE_WIDTH = 800;
const RESIZE_HEIGHT = 600;
const RESIZE_QUALITY = 0.8;

function resizeImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > height) {
        if (width > RESIZE_WIDTH) {
          height = Math.round((height * RESIZE_WIDTH) / width);
          width = RESIZE_WIDTH;
        }
      } else {
        if (height > RESIZE_HEIGHT) {
          width = Math.round((width * RESIZE_HEIGHT) / height);
          height = RESIZE_HEIGHT;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          const resized = new File([blob!], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(resized);
        },
        "image/jpeg",
        RESIZE_QUALITY
      );
    };

    img.src = url;
  });
}

interface ExistingPhoto {
  id: number;
  photoPath: string;
}

interface PhotoUploadProps {
  photos: File[];
  onPhotosChange: (files: File[]) => void;
  existingPhotos?: ExistingPhoto[];
}

export default function PhotoUpload({
  photos,
  onPhotosChange,
  existingPhotos = [],
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const totalCount = photos.length + existingPhotos.length;
  const remaining = MAX_PHOTOS - totalCount;

  const handleFiles = async (files: FileList | null) => {
    if (!files || remaining <= 0) return;

    const incoming = Array.from(files).slice(0, remaining);
    const processed: File[] = [];

    for (const file of incoming) {
      if (file.size > 5 * 1024 * 1024) continue;
      try {
        processed.push(await resizeImage(file));
      } catch {
        // skip files that fail to process
      }
    }

    if (processed.length > 0) {
      onPhotosChange([...photos, ...processed]);
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removeNew = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-[#0077B6] hover:bg-[#0077B6]/5 transition-all duration-150"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="p-2.5 rounded-full bg-[#0077B6]/10">
            <Camera className="h-6 w-6 text-[#0077B6]" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Click or drag to upload photos
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG up to 5 MB each
          </p>
          <span className="text-xs font-medium text-[#0077B6] bg-[#0077B6]/10 px-2.5 py-1 rounded-full">
            {totalCount} / {MAX_PHOTOS} photos
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={remaining <= 0}
        />
      </div>

      {/* Existing saved photos */}
      {existingPhotos.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {existingPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted"
            >
              <img
                src={photo.photoPath}
                alt="Job photo"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* New photos preview */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {photos.map((file, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted group"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeNew(index)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
