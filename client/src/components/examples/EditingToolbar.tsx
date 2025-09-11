import { useState } from 'react';
import EditingToolbar, { Tool } from '../EditingToolbar';

export default function EditingToolbarExample() {
  const [selectedTool, setSelectedTool] = useState<Tool>('move');
  const [canUndo, setCanUndo] = useState(true);
  const [canRedo, setCanRedo] = useState(false);

  const handleToolSelect = (tool: Tool) => {
    console.log('Tool selected:', tool);
    setSelectedTool(tool);
  };

  const handleAction = (action: string) => {
    console.log('Action triggered:', action);
    if (action === 'undo') {
      setCanUndo(false);
      setCanRedo(true);
    } else if (action === 'redo') {
      setCanUndo(true);
      setCanRedo(false);
    }
  };

  return (
    <EditingToolbar
      selectedTool={selectedTool}
      onToolSelect={handleToolSelect}
      onAction={handleAction}
      canUndo={canUndo}
      canRedo={canRedo}
      zoom={0.75}
      imageDimensions={{ width: 1920, height: 1080 }}
    />
  );
}