import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploaderProps {
  onImageUpload: (file: File, imageUrl: string) => void;
}

export default function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      onImageUpload(file, imageUrl);
    }
  }, [onImageUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (imageFile) {
      handleFileUpload(imageFile);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  return (
    <div className="flex items-center justify-center min-h-96">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
          }
        `}
        data-testid="image-upload-zone"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 rounded-full bg-muted">
            {isDragging ? (
              <Upload className="w-8 h-8 text-primary" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragging ? 'Drop your image here' : 'Upload an image'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop or click to select JPEG/PNG files
            </p>
          </div>

          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            data-testid="input-file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="default" className="cursor-pointer" data-testid="button-upload">
              Select Image
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
}