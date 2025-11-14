import React from 'react';
import { IComponent, KnownComponentTypes } from '@core/lib/ecs/IComponent';
import type { IAnimationComponent } from '@core/components/animation/AnimationComponent';
import { AnimationSection } from '@editor/components/panels/InspectorPanel/Animation/AnimationSection';

export interface IAnimationAdapterProps {
  animationComponent: IComponent<IAnimationComponent> | null;
  updateComponent: (type: string, data: IAnimationComponent) => void;
  removeComponent?: (type: string) => void;
  entityId: number;
}

export const AnimationAdapter: React.FC<IAnimationAdapterProps> = ({
  animationComponent,
  updateComponent,
  removeComponent,
  entityId,
}) => {
  const data = animationComponent?.data;

  if (!data) return null;

  const handleUpdate = (newData: IAnimationComponent | null) => {
    if (newData === null) {
      if (removeComponent) {
        removeComponent(KnownComponentTypes.ANIMATION);
      }
    } else {
      updateComponent(KnownComponentTypes.ANIMATION, newData);
    }
  };

  const handleRemove = React.useCallback(() => {
    if (removeComponent) {
      removeComponent(KnownComponentTypes.ANIMATION);
    }
  }, [removeComponent]);

  return (
    <AnimationSection
      animation={data}
      setAnimation={handleUpdate}
      entityId={entityId}
      onRemove={removeComponent ? handleRemove : undefined}
    />
  );
};
