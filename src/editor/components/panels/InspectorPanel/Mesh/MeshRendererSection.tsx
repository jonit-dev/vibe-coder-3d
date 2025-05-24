import React from 'react';
import { FiDroplet } from 'react-icons/fi';

import { ColorPicker } from '@/editor/components/common/ColorPicker';
import { InspectorSection } from '@/editor/components/ui/InspectorSection';

export interface IMeshRendererSettings {
  // Simplified - only keeping what's actually used
  color: string;
}

export const meshRendererDefaults: IMeshRendererSettings = {
  color: '#ffffff',
};

export const MeshRendererSection: React.FC<{
  color: string;
  setColor: (color: string) => void;
}> = ({ color, setColor }) => (
  <InspectorSection
    title="Material"
    icon={<FiDroplet />}
    headerColor="orange"
    collapsible
    defaultCollapsed={false}
  >
    <div className="space-y-2">
      <ColorPicker label="Color" value={color} onChange={setColor} />
    </div>
  </InspectorSection>
);
