import React from 'react';
import { FiDroplet } from 'react-icons/fi';

import { ColorPicker } from '@/editor/components/shared/ColorPicker';
import { InspectorSection } from '@/editor/components/shared/InspectorSection';

export interface IMaterialSettings {
  // Simplified - only keeping what's actually used
  color: string;
}

export const materialDefaults: IMaterialSettings = {
  color: '#ffffff',
};

export const MaterialSection: React.FC<{
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
    <div className="space-y-1">
      <ColorPicker label="Color" value={color} onChange={setColor} />
    </div>
  </InspectorSection>
);
