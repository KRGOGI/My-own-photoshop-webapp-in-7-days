import { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageCanvasProps {
  imageUrl?: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onImageDimensionsChange: (dimensions: { width: number; height: number }) => void;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export default function ImageCanvas({
  imageUrl,
  zoom,
  onZoomChange,
  onImageDimensionsChange,
  brightness,
  contrast,
  saturation,
  rotation,
  flipHorizontal,
  flipVertical
}: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  // Load image
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.onload = () => {
      setImage(img);
      onImageDimensionsChange({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl, onImageDimensionsChange]);

  // Process image data with real adjustments
  const processImageData = useCallback((imageData: ImageData, brightness: number, contrast: number, saturation: number) => {
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
  }, []);

  // Calculate rotated canvas dimensions
  const getRotatedDimensions = useCallback((width: number, height: number, rotation: number) => {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    
    return {
      width: Math.ceil(width * cos + height * sin),
      height: Math.ceil(width * sin + height * cos)
    };
  }, []);

  // Draw image with real processing
  const drawImage = useCallback(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate base dimensions
    const baseWidth = image.naturalWidth;
    const baseHeight = image.naturalHeight;
    
    // Calculate dimensions after rotation
    const rotatedDims = getRotatedDimensions(baseWidth, baseHeight, rotation);
    
    // Apply zoom to final dimensions
    const displayWidth = rotatedDims.width * zoom;
    const displayHeight = rotatedDims.height * zoom;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Create temporary canvas for processing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = baseWidth;
    tempCanvas.height = baseHeight;

    // Draw original image to temp canvas
    tempCtx.drawImage(image, 0, 0);

    // Only process if adjustments are not at default values
    if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const processedData = processImageData(imageData, brightness, contrast, saturation);
      tempCtx.putImageData(processedData, 0, 0);
    }

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Apply transformations to main canvas
    ctx.save();
    ctx.translate(displayWidth / 2, displayHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
    
    // Draw the processed image
    ctx.drawImage(
      tempCanvas,
      -(baseWidth * zoom) / 2,
      -(baseHeight * zoom) / 2,
      baseWidth * zoom,
      baseHeight * zoom
    );
    
    ctx.restore();
  }, [image, zoom, brightness, contrast, saturation, rotation, flipHorizontal, flipVertical, processImageData, getRotatedDimensions]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.25, 5);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom * 0.8, 0.1);
    onZoomChange(newZoom);
  };

  const handleFitToScreen = () => {
    if (!image || !containerRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    
    const scaleX = containerWidth / image.naturalWidth;
    const scaleY = containerHeight / image.naturalHeight;
    const newZoom = Math.min(scaleX, scaleY, 1);
    
    onZoomChange(newZoom);
    setCanvasOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(zoom * delta, 5));
    onZoomChange(newZoom);
  };

  if (!imageUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20" data-testid="canvas-empty">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Maximize2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No image loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-muted/20" data-testid="canvas-container">
      {/* Canvas */}
      <div 
        className="w-full h-full flex items-center justify-center relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`
        }}
      >
        <canvas
          ref={canvasRef}
          className="shadow-lg border border-border/50"
          data-testid="canvas-image"
        />
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-card/95 border border-border rounded-lg p-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={handleZoomOut}
          data-testid="button-zoom-out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <span className="text-sm font-medium min-w-12 text-center" data-testid="text-zoom-display">
          {Math.round(zoom * 100)}%
        </span>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleZoomIn}
          data-testid="button-zoom-in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleFitToScreen}
          data-testid="button-fit-screen"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}