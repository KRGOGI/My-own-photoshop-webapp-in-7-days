import { useState, useCallback } from 'react';
import ImageUploader from './ImageUploader';
import EditingToolbar, { Tool } from './EditingToolbar';
import ImageCanvas from './ImageCanvas';
import AdjustmentPanel from './AdjustmentPanel';

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
  const [image, setImage] = useState<ImageState | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>('move');
  const [zoom, setZoom] = useState(1);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | undefined>();
  
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
        console.log('Download triggered for:', image.file.name);
        // In a real implementation, this would process the canvas and download
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
              rotation={image.rotation}
              flipHorizontal={image.flipHorizontal}
              flipVertical={image.flipVertical}
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