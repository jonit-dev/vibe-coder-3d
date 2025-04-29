import React from 'react';

import { Collapsible } from '@/editor/components/common/Collapsible';
import { TransformFields } from '@/editor/components/panels/InspectorPanel/TransformFields/TransformFields';

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
  <Collapsible title="Transform" defaultOpen>
    <TransformFields label="Position" value={position} onChange={setPosition} />
    <TransformFields label="Rotation" value={rotation} onChange={setRotation} />
    <TransformFields label="Scale" value={scale} onChange={setScale} />
  </Collapsible>
);
