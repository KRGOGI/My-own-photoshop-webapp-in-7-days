import { useState } from 'react';
import ImageCanvas from '../ImageCanvas';

export default function ImageCanvasExample() {
  const [zoom, setZoom] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Mock image URL for demo
  const mockImageUrl = "data:image/svg+xml,%3Csvg width='800' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Crect width='800' height='600' fill='%23f0f0f0'/%3E%3Ctext x='400' y='300' text-anchor='middle' font-family='Arial' font-size='24' fill='%23666'%3ESample Image%3C/text%3E%3C/g%3E%3C/svg%3E";

  return (
    <div className="h-96">
      <ImageCanvas
        imageUrl={mockImageUrl}
        zoom={zoom}
        onZoomChange={setZoom}
        onImageDimensionsChange={setDimensions}
        brightness={100}
        contrast={100}
        saturation={100}
        rotation={0}
        flipHorizontal={false}
        flipVertical={false}
        selectedTool="move"
        onCropApply={(cropData) => console.log('Crop applied:', cropData)}
      />
    </div>
  );
}