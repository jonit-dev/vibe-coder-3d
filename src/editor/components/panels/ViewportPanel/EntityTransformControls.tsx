import { TransformControls } from '@react-three/drei';
import React, { useEffect, useRef } from 'react';
import { Object3D } from 'three';

type GizmoMode = 'translate' | 'rotate' | 'scale';

interface IEntityTransformControlsProps {
  selected: boolean;
  mode: GizmoMode;
  onObjectChange?: () => void;
  setIsTransforming?: (dragging: boolean) => void;
  children: React.ReactNode;
}

export const EntityTransformControls: React.FC<IEntityTransformControlsProps> = ({
  selected,
  mode,
  onObjectChange,
  setIsTransforming,
  children,
}) => {
  const transformRef = useRef<Object3D | null>(null);

  useEffect(() => {
    if (!selected || !setIsTransforming) return;
    const controls = transformRef.current;
    if (!controls) return;
    const callback = (event: { value: boolean }) => setIsTransforming(event.value);
    controls.addEventListener('dragging-changed', callback);
    return () => controls.removeEventListener('dragging-changed', callback);
  }, [selected, setIsTransforming]);

  if (!selected) {
    return <group>{children}</group>;
  }
  return (
    <TransformControls
      ref={transformRef}
      mode={mode}
      showX
      showY
      showZ
      onObjectChange={onObjectChange}
    >
      <group>{children}</group>
    </TransformControls>
  );
};
