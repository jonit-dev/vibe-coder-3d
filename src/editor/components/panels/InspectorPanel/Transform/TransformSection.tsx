import React from 'react';
import { FiMove } from 'react-icons/fi';

import { isComponentRemovable } from '@/core/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { TransformFields } from '@/editor/components/panels/InspectorPanel/Transform/TransformFields/TransformFields';
import { InspectorSection } from '@/editor/components/shared/InspectorSection';

export interface ITransformSectionProps {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  setPosition: (next: [number, number, number]) => void;
  setRotation: (next: [number, number, number]) => void;
  setScale: (next: [number, number, number]) => void;
  onRemove?: () => void;
}

export const TransformSection: React.FC<ITransformSectionProps> = ({
  position,
  rotation,
  scale,
  setPosition,
  setRotation,
  setScale,
  onRemove,
}) => {
  const removable = isComponentRemovable(KnownComponentTypes.TRANSFORM);

  return (
    <InspectorSection
      title="Transform"
      icon={<FiMove />}
      headerColor="green"
      collapsible
      defaultCollapsed={false}
      removable={removable}
      onRemove={onRemove}
    >
      <div className="space-y-1">
        <TransformFields label="Position" value={position} onChange={setPosition} />
        <TransformFields label="Rotation" value={rotation} onChange={setRotation} />
        <TransformFields label="Scale" value={scale} onChange={setScale} />
      </div>
    </InspectorSection>
  );
};
