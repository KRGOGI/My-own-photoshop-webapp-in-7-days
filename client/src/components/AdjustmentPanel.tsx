import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface AdjustmentPanelProps {
  brightness: number;
  onBrightnessChange: (value: number) => void;
  contrast: number;
  onContrastChange: (value: number) => void;
  saturation: number;
  onSaturationChange: (value: number) => void;
  onReset: () => void;
}

export default function AdjustmentPanel({
  brightness,
  onBrightnessChange,
  contrast,
  onContrastChange,
  saturation,
  onSaturationChange,
  onReset
}: AdjustmentPanelProps) {
  return (
    <div className="w-80 bg-card border-l border-border p-6 space-y-6" data-testid="panel-adjustments">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Adjustments</h3>
        <Button
          size="icon"
          variant="ghost"
          onClick={onReset}
          data-testid="button-reset-adjustments"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Brightness */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="brightness" className="text-sm font-medium">
              Brightness
            </Label>
            <span className="text-sm text-muted-foreground" data-testid="text-brightness-value">
              {brightness}%
            </span>
          </div>
          <Slider
            id="brightness"
            value={[brightness]}
            onValueChange={(value) => onBrightnessChange(value[0])}
            min={0}
            max={200}
            step={1}
            className="w-full"
            data-testid="slider-brightness"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="contrast" className="text-sm font-medium">
              Contrast
            </Label>
            <span className="text-sm text-muted-foreground" data-testid="text-contrast-value">
              {contrast}%
            </span>
          </div>
          <Slider
            id="contrast"
            value={[contrast]}
            onValueChange={(value) => onContrastChange(value[0])}
            min={0}
            max={200}
            step={1}
            className="w-full"
            data-testid="slider-contrast"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="saturation" className="text-sm font-medium">
              Saturation
            </Label>
            <span className="text-sm text-muted-foreground" data-testid="text-saturation-value">
              {saturation}%
            </span>
          </div>
          <Slider
            id="saturation"
            value={[saturation]}
            onValueChange={(value) => onSaturationChange(value[0])}
            min={0}
            max={200}
            step={1}
            className="w-full"
            data-testid="slider-saturation"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Quick Presets</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onBrightnessChange(110);
              onContrastChange(120);
              onSaturationChange(110);
            }}
            data-testid="button-preset-vivid"
          >
            Vivid
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onBrightnessChange(90);
              onContrastChange(80);
              onSaturationChange(60);
            }}
            data-testid="button-preset-vintage"
          >
            Vintage
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onBrightnessChange(85);
              onContrastChange(130);
              onSaturationChange(120);
            }}
            data-testid="button-preset-dramatic"
          >
            Dramatic
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onBrightnessChange(105);
              onContrastChange(95);
              onSaturationChange(80);
            }}
            data-testid="button-preset-soft"
          >
            Soft
          </Button>
        </div>
      </div>
    </div>
  );
}