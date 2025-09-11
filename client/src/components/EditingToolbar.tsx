import { useState } from 'react';
import { 
  Crop, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Download,
  Undo,
  Redo,
  Move,
  Maximize
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export type Tool = 'move' | 'crop' | 'rotate' | 'flip-h' | 'flip-v';

interface EditingToolbarProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
  onAction: (action: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  imageDimensions?: { width: number; height: number };
}

export default function EditingToolbar({
  selectedTool,
  onToolSelect,
  onAction,
  canUndo,
  canRedo,
  zoom,
  imageDimensions
}: EditingToolbarProps) {
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const tools = [
    { id: 'move' as Tool, icon: Move, label: 'Move' },
    { id: 'crop' as Tool, icon: Crop, label: 'Crop' },
  ];

  const actions = [
    { id: 'rotate', icon: RotateCw, label: 'Rotate' },
    { id: 'flip-horizontal', icon: FlipHorizontal, label: 'Flip H' },
    { id: 'flip-vertical', icon: FlipVertical, label: 'Flip V' },
  ];

  return (
    <div className="bg-card border-b border-border p-2 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-2">
        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={!canUndo}
            onClick={() => onAction('undo')}
            data-testid="button-undo"
            onMouseEnter={() => setIsHovered('undo')}
            onMouseLeave={() => setIsHovered(null)}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={!canRedo}
            onClick={() => onAction('redo')}
            data-testid="button-redo"
            onMouseEnter={() => setIsHovered('redo')}
            onMouseLeave={() => setIsHovered(null)}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Selection Tools */}
        <div className="flex items-center space-x-1">
          {tools.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              size="icon"
              variant={selectedTool === id ? "default" : "ghost"}
              onClick={() => onToolSelect(id)}
              data-testid={`button-tool-${id}`}
              onMouseEnter={() => setIsHovered(label)}
              onMouseLeave={() => setIsHovered(null)}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Transform Actions */}
        <div className="flex items-center space-x-1">
          {actions.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              size="icon"
              variant="ghost"
              onClick={() => onAction(id)}
              data-testid={`button-action-${id}`}
              onMouseEnter={() => setIsHovered(label)}
              onMouseLeave={() => setIsHovered(null)}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Info Display */}
      <div className="flex items-center space-x-4">
        {imageDimensions && (
          <Badge variant="secondary" data-testid="text-dimensions">
            {imageDimensions.width} × {imageDimensions.height}
          </Badge>
        )}
        
        <Badge variant="secondary" data-testid="text-zoom">
          {Math.round(zoom * 100)}%
        </Badge>

        <Button
          variant="default"
          size="sm"
          onClick={() => onAction('download')}
          data-testid="button-download"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Tooltip */}
      {isHovered && (
        <div className="fixed z-50 bg-popover text-popover-foreground px-2 py-1 rounded text-xs pointer-events-none"
             style={{ 
               left: '50%', 
               transform: 'translateX(-50%)',
               top: '60px'
             }}>
          {isHovered}
        </div>
      )}
    </div>
  );
}