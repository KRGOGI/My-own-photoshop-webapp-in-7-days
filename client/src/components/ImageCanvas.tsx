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

  // Draw image with filters
  const drawImage = useCallback(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = image.naturalWidth * zoom;
    const displayHeight = image.naturalHeight * zoom;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.save();
    
    // Apply transformations
    ctx.translate(displayWidth / 2, displayHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
    
    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    
    ctx.drawImage(
      image,
      -displayWidth / 2,
      -displayHeight / 2,
      displayWidth,
      displayHeight
    );
    
    ctx.restore();
  }, [image, zoom, brightness, contrast, rotation, flipHorizontal, flipVertical]);

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