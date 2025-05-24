import React from 'react';
import { FiMove } from 'react-icons/fi';

import { TransformFields } from '@/editor/components/panels/InspectorPanel/Transform/TransformFields/TransformFields';
import { InspectorSection } from '@/editor/components/ui/InspectorSection';

export interface ITransformSectionProps {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  setPosition: (next: [number, number, number]) => void;
  setRotation: (next: [number, number, number]) => void;
  setScale: (next: [number, number, number]) => void;
}

export const TransformSection: React.FC<ITransformSectionProps> = ({
  position,
  rotation,
  scale,
  setPosition,
  setRotation,
  setScale,
}) => (
  <InspectorSection
    title="Transform"
    icon={<FiMove />}
    headerColor="green"
    collapsible
    defaultCollapsed={false}
  >
    <div className="space-y-2">
      <TransformFields label="Position" value={position} onChange={setPosition} />
      <TransformFields label="Rotation" value={rotation} onChange={setRotation} />
      <TransformFields label="Scale" value={scale} onChange={setScale} />
    </div>
  </InspectorSection>
);
