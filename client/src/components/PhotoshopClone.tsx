import { useState, useCallback } from 'react';
import ImageUploader from './ImageUploader';
import EditingToolbar, { Tool } from './EditingToolbar';
import ImageCanvas from './ImageCanvas';
import AdjustmentPanel from './AdjustmentPanel';
import { useToast } from '@/hooks/use-toast';

interface ImageState {
  file: File;
  url: string;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

interface HistoryState extends ImageState {
  timestamp: number;
}

export default function PhotoshopClone() {
  const { toast } = useToast();
  const [image, setImage] = useState<ImageState | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>('move');
  const [zoom, setZoom] = useState(1);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | undefined>();
  const [exportQuality, setExportQuality] = useState(0.92);
  
  // History management
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = useCallback((state: ImageState) => {
    const newHistoryEntry: HistoryState = {
      ...state,
      timestamp: Date.now()
    };
    
    // Remove any history after current index
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHistoryEntry);
    
    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  const updateImage = useCallback((updates: Partial<ImageState>) => {
    if (!image) return;
    
    const newImageState = { ...image, ...updates };
    setImage(newImageState);
    addToHistory(newImageState);
  }, [image, addToHistory]);

  const handleImageUpload = useCallback((file: File, imageUrl: string) => {
    const initialState: ImageState = {
      file,
      url: imageUrl,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    };
    
    setImage(initialState);
    setZoom(1);
    
    // Reset history
    setHistory([{...initialState, timestamp: Date.now()}]);
    setHistoryIndex(0);
  }, []);

  const handleToolSelect = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    console.log('Tool selected:', tool);
  }, []);

  const handleAction = useCallback((action: string) => {
    if (!image) return;

    switch (action) {
      case 'undo':
        if (historyIndex > 0) {
          const prevState = history[historyIndex - 1];
          setImage({
            file: prevState.file,
            url: prevState.url,
            brightness: prevState.brightness,
            contrast: prevState.contrast,
            saturation: prevState.saturation,
            rotation: prevState.rotation,
            flipHorizontal: prevState.flipHorizontal,
            flipVertical: prevState.flipVertical,
          });
          setHistoryIndex(prev => prev - 1);
        }
        break;
        
      case 'redo':
        if (historyIndex < history.length - 1) {
          const nextState = history[historyIndex + 1];
          setImage({
            file: nextState.file,
            url: nextState.url,
            brightness: nextState.brightness,
            contrast: nextState.contrast,
            saturation: nextState.saturation,
            rotation: nextState.rotation,
            flipHorizontal: nextState.flipHorizontal,
            flipVertical: nextState.flipVertical,
          });
          setHistoryIndex(prev => prev + 1);
        }
        break;
        
      case 'rotate':
        updateImage({ rotation: (image.rotation + 90) % 360 });
        break;
        
      case 'flip-horizontal':
        updateImage({ flipHorizontal: !image.flipHorizontal });
        break;
        
      case 'flip-vertical':
        updateImage({ flipVertical: !image.flipVertical });
        break;
        
      case 'download':
        handleImageDownload();
        break;
        
      default:
        console.log('Action triggered:', action);
    }
  }, [image, history, historyIndex, updateImage]);

  const handleResetAdjustments = useCallback(() => {
    if (!image) return;
    updateImage({
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });
  }, [image, updateImage]);

  const handleImageDownload = useCallback(async (exportFormat = 'png') => {
    if (!image) return;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS for better compatibility
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = image.url;
      });

      // Helper function to calculate rotated dimensions
      const getRotatedDimensions = (width: number, height: number, rotation: number) => {
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        return {
          width: Math.ceil(width * cos + height * sin),
          height: Math.ceil(width * sin + height * cos)
        };
      };

      const baseWidth = img.naturalWidth;
      const baseHeight = img.naturalHeight;
      
      // Step 1: Create canvas with color adjustments using ctx.filter (matches live preview)
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        throw new Error('Failed to create canvas context');
      }

      tempCanvas.width = baseWidth;
      tempCanvas.height = baseHeight;
      
      // Apply color adjustments using ctx.filter for perfect fidelity match with live preview
      if (image.brightness !== 100 || image.contrast !== 100 || image.saturation !== 100) {
        tempCtx.filter = `brightness(${image.brightness}%) contrast(${image.contrast}%) saturate(${image.saturation}%)`;
      }
      
      // Draw original image to temp canvas with filter applied
      tempCtx.drawImage(img, 0, 0);
      tempCtx.filter = 'none'; // Reset filter

      // Step 2: Create final canvas with transformations
      let finalCanvas = tempCanvas;
      let finalCtx = tempCtx;
      
      if (image.rotation !== 0 || image.flipHorizontal || image.flipVertical) {
        const rotatedDims = getRotatedDimensions(baseWidth, baseHeight, image.rotation);
        
        finalCanvas = document.createElement('canvas');
        finalCtx = finalCanvas.getContext('2d');
        if (!finalCtx) {
          throw new Error('Failed to create transformation canvas context');
        }

        finalCanvas.width = rotatedDims.width;
        finalCanvas.height = rotatedDims.height;
        
        // Apply transformations
        finalCtx.save();
        finalCtx.translate(rotatedDims.width / 2, rotatedDims.height / 2);
        finalCtx.rotate((image.rotation * Math.PI) / 180);
        finalCtx.scale(image.flipHorizontal ? -1 : 1, image.flipVertical ? -1 : 1);
        
        finalCtx.drawImage(
          tempCanvas,
          -baseWidth / 2,
          -baseHeight / 2,
          baseWidth,
          baseHeight
        );
        
        finalCtx.restore();
      }
      
      // Step 3: Export with format handling and fallback
      const originalName = image.file.name;
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      
      // Determine format and quality
      let mimeType = '';
      let extension = '';
      let quality: number | undefined = undefined;
      
      switch (exportFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          mimeType = 'image/jpeg';
          extension = 'jpg';
          quality = exportQuality;
          break;
        default:
          mimeType = 'image/png';
          extension = 'png';
      }
      
      const filename = `${nameWithoutExt}_edited_${timestamp}.${extension}`;
      
      // Try primary export format
      const tryExport = (type: string, ext: string, qual?: number): Promise<Blob | null> => {
        return new Promise((resolve) => {
          finalCanvas.toBlob((blob) => {
            resolve(blob);
          }, type, qual);
        });
      };
      
      let blob = await tryExport(mimeType, extension, quality);
      let finalFilename = filename;
      
      // Fallback to PNG if primary format fails
      if (!blob && mimeType !== 'image/png') {
        console.warn(`Export as ${mimeType} failed, falling back to PNG`);
        blob = await tryExport('image/png', 'png');
        finalFilename = `${nameWithoutExt}_edited_${timestamp}.png`;
        
        toast({
          title: 'Format fallback',
          description: `Export as ${mimeType.split('/')[1].toUpperCase()} failed. Saved as PNG instead.`,
        });
      }
      
      if (!blob) {
        throw new Error('Export failed - unable to create image blob');
      }
      
      // Create download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export successful',
        description: `Image saved as ${finalFilename}`,
      });
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown export error',
        variant: 'destructive',
      });
    }
  }, [image, exportQuality, toast]);

  const handleCropApply = useCallback((cropData: { x: number; y: number; width: number; height: number }) => {
    if (!image) return;
    
    // Create image element from current image URL
    const img = new Image();
    img.onload = () => {
      // Helper function to calculate rotated dimensions
      const getRotatedDimensions = (width: number, height: number, rotation: number) => {
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        return {
          width: Math.ceil(width * cos + height * sin),
          height: Math.ceil(width * sin + height * cos)
        };
      };

      // Helper function to process image data for color adjustments
      const processImageData = (imageData: ImageData, brightness: number, contrast: number, saturation: number) => {
        const data = imageData.data;
        const brightnessFactor = brightness / 100;
        const contrastFactor = contrast / 100;
        const saturationFactor = saturation / 100;
        
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];
          
          // Apply brightness
          r = r * brightnessFactor;
          g = g * brightnessFactor;
          b = b * brightnessFactor;
          
          // Apply contrast
          r = ((r - 128) * contrastFactor) + 128;
          g = ((g - 128) * contrastFactor) + 128;
          b = ((b - 128) * contrastFactor) + 128;
          
          // Apply saturation
          if (saturationFactor !== 1) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray + (r - gray) * saturationFactor;
            g = gray + (g - gray) * saturationFactor;
            b = gray + (b - gray) * saturationFactor;
          }
          
          // Clamp values
          data[i] = Math.max(0, Math.min(255, r));
          data[i + 1] = Math.max(0, Math.min(255, g));
          data[i + 2] = Math.max(0, Math.min(255, b));
        }
        
        return imageData;
      };

      // Step 1: Create temp canvas with color adjustments
      const baseWidth = img.naturalWidth;
      const baseHeight = img.naturalHeight;
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCanvas.width = baseWidth;
      tempCanvas.height = baseHeight;
      
      // Draw original image to temp canvas
      tempCtx.drawImage(img, 0, 0);
      
      // Apply color adjustments if they're not at default values
      if (image.brightness !== 100 || image.contrast !== 100 || image.saturation !== 100) {
        const imageData = tempCtx.getImageData(0, 0, baseWidth, baseHeight);
        const processedData = processImageData(imageData, image.brightness, image.contrast, image.saturation);
        tempCtx.putImageData(processedData, 0, 0);
      }

      // Step 2: Create transformed canvas that bakes in rotation and flip (WYSIWYG)
      const rotatedDims = getRotatedDimensions(baseWidth, baseHeight, image.rotation);
      
      const transformedCanvas = document.createElement('canvas');
      const transformedCtx = transformedCanvas.getContext('2d');
      if (!transformedCtx) return;

      transformedCanvas.width = rotatedDims.width;
      transformedCanvas.height = rotatedDims.height;
      
      // Apply the same transformations as the display canvas
      transformedCtx.save();
      transformedCtx.translate(rotatedDims.width / 2, rotatedDims.height / 2);
      transformedCtx.rotate((image.rotation * Math.PI) / 180);
      transformedCtx.scale(image.flipHorizontal ? -1 : 1, image.flipVertical ? -1 : 1);
      
      // Draw the color-adjusted image with transformations
      transformedCtx.drawImage(
        tempCanvas,
        -baseWidth / 2,
        -baseHeight / 2,
        baseWidth,
        baseHeight
      );
      
      transformedCtx.restore();

      // Step 3: Transform crop coordinates from image space to transformed canvas space
      
      // Helper function to transform a point using the same transformation as the display
      const transformPoint = (x: number, y: number) => {
        // Start with point relative to image center
        const centerX = baseWidth / 2;
        const centerY = baseHeight / 2;
        let px = x - centerX;
        let py = y - centerY;
        
        // Apply rotation FIRST (to match display canvas and overlay order)
        const rad = (image.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const rotatedX = px * cos - py * sin;
        const rotatedY = px * sin + py * cos;
        
        // Apply flip scaling AFTER rotation (to match display canvas and overlay order)
        let finalX = rotatedX;
        let finalY = rotatedY;
        if (image.flipHorizontal) finalX = -finalX;
        if (image.flipVertical) finalY = -finalY;
        
        // Translate to transformed canvas center
        const transformedCenterX = rotatedDims.width / 2;
        const transformedCenterY = rotatedDims.height / 2;
        
        return {
          x: finalX + transformedCenterX,
          y: finalY + transformedCenterY
        };
      };
      
      // Transform the four corners of the crop rectangle
      const corner1 = transformPoint(cropData.x, cropData.y);
      const corner2 = transformPoint(cropData.x + cropData.width, cropData.y);
      const corner3 = transformPoint(cropData.x + cropData.width, cropData.y + cropData.height);
      const corner4 = transformPoint(cropData.x, cropData.y + cropData.height);
      
      // Find the axis-aligned bounding box of the transformed corners
      const minX = Math.max(0, Math.floor(Math.min(corner1.x, corner2.x, corner3.x, corner4.x)));
      const minY = Math.max(0, Math.floor(Math.min(corner1.y, corner2.y, corner3.y, corner4.y)));
      const maxX = Math.min(rotatedDims.width, Math.ceil(Math.max(corner1.x, corner2.x, corner3.x, corner4.x)));
      const maxY = Math.min(rotatedDims.height, Math.ceil(Math.max(corner1.y, corner2.y, corner3.y, corner4.y)));
      
      // Calculate the final crop dimensions
      const transformedCropWidth = maxX - minX;
      const transformedCropHeight = maxY - minY;
      
      // Guard against zero or negative dimensions
      if (transformedCropWidth <= 0 || transformedCropHeight <= 0) {
        console.warn('Invalid crop dimensions after transformation');
        return;
      }

      // Step 4: Create final canvas for cropped result  
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) return;

      // Set canvas size to transformed crop dimensions
      finalCanvas.width = transformedCropWidth;
      finalCanvas.height = transformedCropHeight;

      // Draw the cropped portion from the transformed canvas using transformed coordinates
      finalCtx.drawImage(
        transformedCanvas,
        minX, minY, transformedCropWidth, transformedCropHeight, // Source rectangle in transformed canvas space
        0, 0, transformedCropWidth, transformedCropHeight // Destination rectangle
      );
      
      // Convert to blob and create new image URL
      finalCanvas.toBlob((blob) => {
        if (blob) {
          const newImageUrl = URL.createObjectURL(blob);
          
          // Update image state with cropped image (WYSIWYG - transformations are baked in)
          const newImageState: ImageState = {
            ...image,
            url: newImageUrl,
            // Reset all transformations since they're now baked into the image
            brightness: 100,
            contrast: 100,
            saturation: 100,
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
          };
          
          setImage(newImageState);
          addToHistory(newImageState);
          setZoom(1); // Reset zoom after crop
          
          // Clean up old URL to prevent memory leaks
          if (image.url.startsWith('blob:')) {
            URL.revokeObjectURL(image.url);
          }
        }
      }, 'image/png');
    };
    
    img.src = image.url;
  }, [image, addToHistory]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Toolbar */}
      {image && (
        <EditingToolbar
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
          onAction={handleAction}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          zoom={zoom}
          imageDimensions={imageDimensions}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {image ? (
            <ImageCanvas
              imageUrl={image.url}
              zoom={zoom}
              onZoomChange={setZoom}
              onImageDimensionsChange={setImageDimensions}
              brightness={image.brightness}
              contrast={image.contrast}
              saturation={image.saturation}
              rotation={image.rotation}
              flipHorizontal={image.flipHorizontal}
              flipVertical={image.flipVertical}
              selectedTool={selectedTool}
              onCropApply={handleCropApply}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <ImageUploader onImageUpload={handleImageUpload} />
            </div>
          )}
        </div>

        {/* Right Panel */}
        {image && (
          <AdjustmentPanel
            brightness={image.brightness}
            onBrightnessChange={(value) => updateImage({ brightness: value })}
            contrast={image.contrast}
            onContrastChange={(value) => updateImage({ contrast: value })}
            saturation={image.saturation}
            onSaturationChange={(value) => updateImage({ saturation: value })}
            onReset={handleResetAdjustments}
          />
        )}
      </div>
    </div>
  );
}