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
  grayscale: boolean;
  sepia: boolean;
  blur: number;
  sharpen: number;
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
  grayscale,
  sepia,
  blur,
  sharpen,
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
  
  // Current values for animation system - use refs to avoid stale closures
  const currentZoomRef = useRef(zoom);
  const currentOffsetRef = useRef(canvasOffset);
  const targetZoomRef = useRef(zoom);
  const targetOffsetRef = useRef(canvasOffset);
  
  // Animation system
  const animationFrameRef = useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Caching system for processed image
  const processedImageRef = useRef<HTMLCanvasElement | null>(null);
  const lastProcessedFiltersRef = useRef<string>('');
  
  // Pan interaction coalescing
  const panRafRef = useRef<number | null>(null);
  const targetPanOffsetRef = useRef(canvasOffset);

  // Load image
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.onload = () => {
      setImage(img);
      onImageDimensionsChange({ width: img.naturalWidth, height: img.naturalHeight });
      // Clear cached processed image when new image loads
      processedImageRef.current = null;
      lastProcessedFiltersRef.current = '';
    };
    img.src = imageUrl;
  }, [imageUrl, onImageDimensionsChange]);

  // Sync refs with state to avoid stale closures
  useEffect(() => {
    currentZoomRef.current = zoom;
    targetZoomRef.current = zoom;
  }, [zoom]);
  
  useEffect(() => {
    currentOffsetRef.current = canvasOffset;
    targetOffsetRef.current = canvasOffset;
    targetPanOffsetRef.current = canvasOffset;
  }, [canvasOffset]);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '0':
            e.preventDefault();
            handleFitToScreen();
            break;
          case '=':
          case '+':
            e.preventDefault();
            handleZoomIn();
            break;
          case '-':
            e.preventDefault();
            handleZoomOut();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Double-click to fit to screen
  const handleDoubleClick = () => {
    handleFitToScreen();
  };

  // Apply all filters using ctx.filter for perfect fidelity (same as export function)
  const applyAllFilters = useCallback((ctx: CanvasRenderingContext2D, brightness: number, contrast: number, saturation: number, grayscale: boolean, sepia: boolean, blur: number, sharpen: number) => {
    const filters = [];
    
    // Basic adjustments
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100 || sharpen > 0) {
      // Approximate sharpen as additional contrast for simplicity
      const totalContrast = contrast + (sharpen * 0.5); // sharpen contributes to contrast
      filters.push(`contrast(${totalContrast}%)`);
    }
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    
    // Filter effects
    if (grayscale) filters.push('grayscale(100%)');
    if (sepia) filters.push('sepia(100%)');
    if (blur > 0) filters.push(`blur(${blur}px)`);
    
    ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
  }, []);

  // Create fingerprint for cached processed image
  const getProcessingFingerprint = useCallback(() => {
    return JSON.stringify({
      brightness, contrast, saturation, rotation, 
      flipHorizontal, flipVertical, grayscale, sepia, blur, sharpen
    });
  }, [brightness, contrast, saturation, rotation, flipHorizontal, flipVertical, grayscale, sepia, blur, sharpen]);

  // Get or create cached processed image
  const getProcessedImage = useCallback(() => {
    if (!image) return null;
    
    const currentFingerprint = getProcessingFingerprint();
    
    // Check if cached version is still valid
    if (processedImageRef.current && lastProcessedFiltersRef.current === currentFingerprint) {
      return processedImageRef.current;
    }
    
    // Create new processed image
    const processedCanvas = document.createElement('canvas');
    const processedCtx = processedCanvas.getContext('2d');
    if (!processedCtx) return null;
    
    const baseWidth = image.naturalWidth;
    const baseHeight = image.naturalHeight;
    
    processedCanvas.width = baseWidth;
    processedCanvas.height = baseHeight;
    
    // Apply filters
    applyAllFilters(processedCtx, brightness, contrast, saturation, grayscale, sepia, blur, sharpen);
    processedCtx.drawImage(image, 0, 0);
    processedCtx.filter = 'none';
    
    // Cache the result
    processedImageRef.current = processedCanvas;
    lastProcessedFiltersRef.current = currentFingerprint;
    
    return processedCanvas;
  }, [image, getProcessingFingerprint, applyAllFilters]);

  // Center-aware pan constraints - fixed formula
  const constrainPanOffset = useCallback((
    offset: { x: number; y: number },
    displayWidth: number,
    displayHeight: number,
    containerWidth: number,
    containerHeight: number
  ) => {
    const margin = 100; // Minimum visible pixels
    
    // Center-aware bounds: offsetX ∈ [margin - (containerW + displayW)/2, (containerW + displayW)/2 - margin]
    const minX = margin - (containerWidth + displayWidth) / 2;
    const maxX = (containerWidth + displayWidth) / 2 - margin;
    const minY = margin - (containerHeight + displayHeight) / 2;
    const maxY = (containerHeight + displayHeight) / 2 - margin;
    
    return {
      x: Math.max(minX, Math.min(maxX, offset.x)),
      y: Math.max(minY, Math.min(maxY, offset.y))
    };
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

  // Draw image with cached processing for performance
  const drawImage = useCallback(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get cached processed image
    const processedImage = getProcessedImage();
    if (!processedImage) return;

    // Calculate base dimensions
    const baseWidth = image.naturalWidth;
    const baseHeight = image.naturalHeight;
    
    // Calculate dimensions after rotation
    const rotatedDims = getRotatedDimensions(baseWidth, baseHeight, rotation);
    
    // Apply zoom to final dimensions
    const displayWidth = rotatedDims.width * currentZoomRef.current;
    const displayHeight = rotatedDims.height * currentZoomRef.current;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Apply transformations to main canvas
    ctx.save();
    ctx.translate(displayWidth / 2, displayHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
    
    // Draw the cached processed image
    ctx.drawImage(
      processedImage,
      -(baseWidth * currentZoomRef.current) / 2,
      -(baseHeight * currentZoomRef.current) / 2,
      baseWidth * currentZoomRef.current,
      baseHeight * currentZoomRef.current
    );
    
    ctx.restore();
  }, [image, rotation, flipHorizontal, flipVertical, getRotatedDimensions, getProcessedImage]);

  useEffect(() => {
    drawImage();
  }, [drawImage, zoom]);

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

  // Fixed animation loop using refs to avoid stale closures
  const updateAnimation = useCallback(() => {
    if (!isAnimating) return;
    
    // Read from refs to avoid stale closures
    const currentZoom = currentZoomRef.current;
    const currentOffset = currentOffsetRef.current;
    const targetZoom = targetZoomRef.current;
    const targetOffset = targetOffsetRef.current;
    
    // Smooth interpolation with easing
    const lerpFactor = 0.15;
    const zoomDiff = Math.abs(targetZoom - currentZoom);
    const offsetDiffX = Math.abs(targetOffset.x - currentOffset.x);
    const offsetDiffY = Math.abs(targetOffset.y - currentOffset.y);
    
    // Stop animation when within epsilon to prevent perpetual loops
    if (zoomDiff < 0.001 && offsetDiffX < 0.5 && offsetDiffY < 0.5) {
      // Animation complete - update state one final time and stop
      currentZoomRef.current = targetZoom;
      currentOffsetRef.current = targetOffset;
      onZoomChange(targetZoom);
      setCanvasOffset(targetOffset);
      setIsAnimating(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    // Interpolate values
    const newZoom = currentZoom + (targetZoom - currentZoom) * lerpFactor;
    const newOffset = {
      x: currentOffset.x + (targetOffset.x - currentOffset.x) * lerpFactor,
      y: currentOffset.y + (targetOffset.y - currentOffset.y) * lerpFactor
    };
    
    // Update refs first
    currentZoomRef.current = newZoom;
    currentOffsetRef.current = newOffset;
    
    // Trigger canvas redraw with new zoom/offset
    drawImage();
    
    // Update state
    onZoomChange(newZoom);
    setCanvasOffset(newOffset);
    
    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(updateAnimation);
  }, [isAnimating, onZoomChange, drawImage]);
  
  useEffect(() => {
    if (isAnimating && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateAnimation);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isAnimating, updateAnimation]);

  // Coalesced pan update using rAF
  const updatePanCoalesced = useCallback(() => {
    if (!panRafRef.current) return;
    
    panRafRef.current = null;
    
    const targetOffset = targetPanOffsetRef.current;
    setCanvasOffset(targetOffset);
    currentOffsetRef.current = targetOffset;
  }, []);

  // Schedule coalesced pan update
  const schedulePanUpdate = useCallback((newOffset: { x: number; y: number }) => {
    targetPanOffsetRef.current = newOffset;
    
    if (!panRafRef.current) {
      panRafRef.current = requestAnimationFrame(updatePanCoalesced);
    }
  }, [updatePanCoalesced]);
  
  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoomRef.current * 1.2, 5);
    targetZoomRef.current = newZoom;
    if (!isAnimating) {
      setIsAnimating(true);
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoomRef.current * 0.8, 0.1);
    targetZoomRef.current = newZoom;
    if (!isAnimating) {
      setIsAnimating(true);
    }
  };

  const handleFitToScreen = () => {
    if (!image || !containerRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    
    const rotatedDims = getRotatedDimensions(image.naturalWidth, image.naturalHeight, rotation);
    const scaleX = containerWidth / rotatedDims.width;
    const scaleY = containerHeight / rotatedDims.height;
    const newZoom = Math.min(scaleX, scaleY, 1);
    
    targetZoomRef.current = newZoom;
    targetOffsetRef.current = { x: 0, y: 0 };
    if (!isAnimating) {
      setIsAnimating(true);
    }
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
    
    const displayWidth = rotatedDims.width * currentZoomRef.current;
    const displayHeight = rotatedDims.height * currentZoomRef.current;
    
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
    const imageX = (x / currentZoomRef.current) + baseWidth / 2;
    const imageY = (y / currentZoomRef.current) + baseHeight / 2;
    
    return {
      x: Math.max(0, Math.min(baseWidth, imageX)),
      y: Math.max(0, Math.min(baseHeight, imageY))
    };
  }, [image, rotation, flipHorizontal, flipVertical, getRotatedDimensions]);

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
      // Use coalesced pan updates for smooth performance
      const currentOffset = currentOffsetRef.current;
      const newX = currentOffset.x + e.movementX;
      const newY = currentOffset.y + e.movementY;
      
      if (!image || !containerRef.current) {
        schedulePanUpdate({ x: newX, y: newY });
        return;
      }
      
      const container = containerRef.current;
      const rotatedDims = getRotatedDimensions(image.naturalWidth, image.naturalHeight, rotation);
      const displayWidth = rotatedDims.width * currentZoomRef.current;
      const displayHeight = rotatedDims.height * currentZoomRef.current;
      
      const constrainedOffset = constrainPanOffset(
        { x: newX, y: newY },
        displayWidth,
        displayHeight,
        container.clientWidth,
        container.clientHeight
      );
      
      schedulePanUpdate(constrainedOffset);
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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (!containerRef.current) return;
    
    // Use container for cursor position in CSS pixel coordinate space
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    
    // Continuous scaling with proper delta calculation
    const sensitivity = 0.0015;
    const currentZoom = currentZoomRef.current;
    const newZoom = Math.max(0.1, Math.min(currentZoom * Math.exp(-e.deltaY * sensitivity), 5));
    
    if (newZoom !== currentZoom && image) {
      // Calculate dimensions in CSS pixels
      const baseWidth = image.naturalWidth;
      const baseHeight = image.naturalHeight;
      const rotatedDims = getRotatedDimensions(baseWidth, baseHeight, rotation);
      
      const currentDisplayWidth = rotatedDims.width * currentZoom;
      const currentDisplayHeight = rotatedDims.height * currentZoom;
      const newDisplayWidth = rotatedDims.width * newZoom;
      const newDisplayHeight = rotatedDims.height * newZoom;
      
      // Calculate container center in CSS pixels
      const containerCenterX = container.clientWidth / 2;
      const containerCenterY = container.clientHeight / 2;
      
      // Current position of cursor relative to image center
      const currentOffset = currentOffsetRef.current;
      const relativeCursorX = cursorX - (containerCenterX + currentOffset.x);
      const relativeCursorY = cursorY - (containerCenterY + currentOffset.y);
      
      // Calculate new offset to keep cursor point fixed
      const scaleChange = newZoom / currentZoom;
      const newOffsetX = currentOffset.x - relativeCursorX * (scaleChange - 1);
      const newOffsetY = currentOffset.y - relativeCursorY * (scaleChange - 1);
      
      // Apply proper pan constraints using center-aware bounds
      const constrainedOffset = constrainPanOffset(
        { x: newOffsetX, y: newOffsetY },
        newDisplayWidth,
        newDisplayHeight,
        container.clientWidth,
        container.clientHeight
      );
      
      // Set targets for smooth animation
      targetZoomRef.current = newZoom;
      targetOffsetRef.current = constrainedOffset;
      
      if (!isAnimating) {
        setIsAnimating(true);
      }
    }
  }, [image, rotation, getRotatedDimensions, isAnimating, constrainPanOffset]);

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
        onDoubleClick={handleDoubleClick}
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