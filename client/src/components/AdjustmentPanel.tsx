import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RotateCcw } from 'lucide-react';

interface AdjustmentPanelProps {
  brightness: number;
  onBrightnessChange: (value: number) => void;
  contrast: number;
  onContrastChange: (value: number) => void;
  saturation: number;
  onSaturationChange: (value: number) => void;
  grayscale: boolean;
  onGrayscaleChange: (value: boolean) => void;
  sepia: boolean;
  onSepiaChange: (value: boolean) => void;
  blur: number;
  onBlurChange: (value: number) => void;
  sharpen: number;
  onSharpenChange: (value: number) => void;
  onReset: () => void;
}

export default function AdjustmentPanel({
  brightness,
  onBrightnessChange,
  contrast,
  onContrastChange,
  saturation,
  onSaturationChange,
  grayscale,
  onGrayscaleChange,
  sepia,
  onSepiaChange,
  blur,
  onBlurChange,
  sharpen,
  onSharpenChange,
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

        {/* Filters */}
        <div className="space-y-4 pt-2 border-t border-border">
          <Label className="text-sm font-medium">Filters</Label>
          
          {/* Grayscale */}
          <div className="flex items-center justify-between">
            <Label htmlFor="grayscale" className="text-sm font-medium">
              Grayscale
            </Label>
            <Switch
              id="grayscale"
              checked={grayscale}
              onCheckedChange={onGrayscaleChange}
              data-testid="switch-grayscale"
            />
          </div>

          {/* Sepia */}
          <div className="flex items-center justify-between">
            <Label htmlFor="sepia" className="text-sm font-medium">
              Sepia
            </Label>
            <Switch
              id="sepia"
              checked={sepia}
              onCheckedChange={onSepiaChange}
              data-testid="switch-sepia"
            />
          </div>

          {/* Blur */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="blur" className="text-sm font-medium">
                Blur
              </Label>
              <span className="text-sm text-muted-foreground" data-testid="text-blur-value">
                {blur}px
              </span>
            </div>
            <Slider
              id="blur"
              value={[blur]}
              onValueChange={(value) => onBlurChange(value[0])}
              min={0}
              max={10}
              step={0.5}
              className="w-full"
              data-testid="slider-blur"
            />
          </div>

          {/* Sharpen */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="sharpen" className="text-sm font-medium">
                Sharpen
              </Label>
              <span className="text-sm text-muted-foreground" data-testid="text-sharpen-value">
                {sharpen}%
              </span>
            </div>
            <Slider
              id="sharpen"
              value={[sharpen]}
              onValueChange={(value) => onSharpenChange(value[0])}
              min={0}
              max={200}
              step={10}
              className="w-full"
              data-testid="slider-sharpen"
            />
          </div>
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