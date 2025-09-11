import { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tool } from './EditingToolbar';

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
  selectedTool: Tool;
  onCropApply: (cropData: { x: number; y: number; width: number; height: number }) => void;
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
  flipVertical,
  selectedTool,
  onCropApply
}: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

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

  // Apply color adjustments using ctx.filter for perfect fidelity (same as export function)
  const applyColorAdjustments = useCallback((ctx: CanvasRenderingContext2D, brightness: number, contrast: number, saturation: number) => {
    if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    } else {
      ctx.filter = 'none';
    }
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

    // Apply color adjustments using ctx.filter (same as export function)
    applyColorAdjustments(tempCtx, brightness, contrast, saturation);
    
    // Draw original image to temp canvas with filter applied
    tempCtx.drawImage(image, 0, 0);
    tempCtx.filter = 'none'; // Reset filter

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
  }, [image, zoom, brightness, contrast, saturation, rotation, flipHorizontal, flipVertical, applyColorAdjustments, getRotatedDimensions]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  // Helper function to transform image coordinates to canvas coordinates
  const imageToCanvasCoords = useCallback((imageX: number, imageY: number) => {
    if (!image) return { x: 0, y: 0 };
    
    const baseWidth = image.naturalWidth;
    const baseHeight = image.naturalHeight;
    const rotatedDims = getRotatedDimensions(baseWidth, baseHeight, rotation);
    
    const displayWidth = rotatedDims.width * zoom;
    const displayHeight = rotatedDims.height * zoom;
    
    // Convert image coordinates to centered coordinates
    let x = (imageX - baseWidth / 2) * zoom;
    let y = (imageY - baseHeight / 2) * zoom;
    
    // Apply the same transformations as the main canvas
    // 1. Rotation
    if (rotation !== 0) {
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;
      x = rotatedX;
      y = rotatedY;
    }
    
    // 2. Scale (flip)
    if (flipHorizontal) x = -x;
    if (flipVertical) y = -y;
    
    // 3. Translate to canvas center
    x += displayWidth / 2;
    y += displayHeight / 2;
    
    return { x, y };
  }, [image, zoom, rotation, flipHorizontal, flipVertical, getRotatedDimensions]);

  // Draw crop overlay with proper transformation support
  const drawCropOverlay = useCallback(() => {
    if (!overlayCanvasRef.current || !canvasRef.current || !cropStart || !cropEnd) return;
    
    const overlayCanvas = overlayCanvasRef.current;
    const mainCanvas = canvasRef.current;
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    // Match overlay canvas size to main canvas
    overlayCanvas.width = mainCanvas.width;
    overlayCanvas.height = mainCanvas.height;
    
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    // Calculate all four corners of the crop rectangle in image space
    const minX = Math.min(cropStart.x, cropEnd.x);
    const minY = Math.min(cropStart.y, cropEnd.y);
    const maxX = Math.max(cropStart.x, cropEnd.x);
    const maxY = Math.max(cropStart.y, cropEnd.y);
    
    // Transform all four corners to canvas space
    const topLeft = imageToCanvasCoords(minX, minY);
    const topRight = imageToCanvasCoords(maxX, minY);
    const bottomRight = imageToCanvasCoords(maxX, maxY);
    const bottomLeft = imageToCanvasCoords(minX, maxY);
    
    // Draw crop rectangle as a polygon to handle rotation properly
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();
    ctx.stroke();
    
    // Draw corner handles at the transformed positions
    ctx.fillStyle = '#3B82F6';
    ctx.setLineDash([]);
    const handleSize = 8;
    
    [topLeft, topRight, bottomRight, bottomLeft].forEach(corner => {
      ctx.fillRect(corner.x - handleSize/2, corner.y - handleSize/2, handleSize, handleSize);
    });
  }, [cropStart, cropEnd, imageToCanvasCoords]);

  useEffect(() => {
    if (selectedTool === 'crop' && (cropStart || cropEnd)) {
      drawCropOverlay();
    }
  }, [selectedTool, cropStart, cropEnd, drawCropOverlay, zoom, rotation, flipHorizontal, flipVertical]);

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

  // Convert screen coordinates to image coordinates
  const screenToImageCoords = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current || !image) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    // Account for canvas scaling and centering
    const baseWidth = image.naturalWidth;
    const baseHeight = image.naturalHeight;
    const rotatedDims = getRotatedDimensions(baseWidth, baseHeight, rotation);
    
    const displayWidth = rotatedDims.width * zoom;
    const displayHeight = rotatedDims.height * zoom;
    
    // Convert canvas coordinates to canvas-centered coordinates
    let x = canvasX - displayWidth / 2;
    let y = canvasY - displayHeight / 2;
    
    // Apply inverse transformations in reverse order (same as main canvas but reversed)
    // 1. Inverse scale (flip)
    if (flipHorizontal) x = -x;
    if (flipVertical) y = -y;
    
    // 2. Inverse rotation
    if (rotation !== 0) {
      const rad = -(rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;
      x = rotatedX;
      y = rotatedY;
    }
    
    // 3. Convert back to image coordinates
    const imageX = (x / zoom) + baseWidth / 2;
    const imageY = (y / zoom) + baseHeight / 2;
    
    return {
      x: Math.max(0, Math.min(baseWidth, imageX)),
      y: Math.max(0, Math.min(baseHeight, imageY))
    };
  }, [image, zoom, rotation, flipHorizontal, flipVertical, getRotatedDimensions]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      if (selectedTool === 'crop') {
        const coords = screenToImageCoords(e.clientX, e.clientY);
        setCropStart(coords);
        setCropEnd(coords);
        setIsCropping(true);
      } else {
        setIsPanning(true);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && selectedTool !== 'crop') {
      setCanvasOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    } else if (isCropping && selectedTool === 'crop') {
      const coords = screenToImageCoords(e.clientX, e.clientY);
      setCropEnd(coords);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (isCropping && cropStart && cropEnd) {
      // Apply crop if selection is valid
      const cropData = {
        x: Math.min(cropStart.x, cropEnd.x),
        y: Math.min(cropStart.y, cropEnd.y),
        width: Math.abs(cropEnd.x - cropStart.x),
        height: Math.abs(cropEnd.y - cropStart.y)
      };
      
      if (cropData.width > 10 && cropData.height > 10) {
        onCropApply(cropData);
      }
      
      // Reset crop selection
      setCropStart(null);
      setCropEnd(null);
      setIsCropping(false);
    }
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
        className={`w-full h-full flex items-center justify-center relative ${
          selectedTool === 'crop' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`
        }}
      >
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="shadow-lg border border-border/50"
            data-testid="canvas-image"
          />
          {selectedTool === 'crop' && (
            <canvas
              ref={overlayCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              data-testid="canvas-crop-overlay"
            />
          )}
        </div>
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