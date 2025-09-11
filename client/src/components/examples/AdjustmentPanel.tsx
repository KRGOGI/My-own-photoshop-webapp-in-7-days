import { useState } from 'react';
import AdjustmentPanel from '../AdjustmentPanel';

export default function AdjustmentPanelExample() {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    console.log('Adjustments reset');
  };

  return (
    <AdjustmentPanel
      brightness={brightness}
      onBrightnessChange={setBrightness}
      contrast={contrast}
      onContrastChange={setContrast}
      saturation={saturation}
      onSaturationChange={setSaturation}
      onReset={handleReset}
    />
  );
}