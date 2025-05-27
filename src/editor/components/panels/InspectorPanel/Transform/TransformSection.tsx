import React from 'react';
import { FiMove } from 'react-icons/fi';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { Vector3Field } from '@/editor/components/shared/Vector3Field';

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
  return (
    <GenericComponentSection
      title="Transform"
      icon={<FiMove />}
      headerColor="green"
      componentId={KnownComponentTypes.TRANSFORM}
      onRemove={onRemove}
    >
      <Vector3Field label="Position" value={position} onChange={setPosition} />
      <Vector3Field label="Rotation" value={rotation} onChange={setRotation} />
      <Vector3Field label="Scale" value={scale} onChange={setScale} resetValue={[1, 1, 1]} />
    </GenericComponentSection>
  );
};
