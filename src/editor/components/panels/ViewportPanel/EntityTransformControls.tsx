import { TransformControls } from '@react-three/drei';
import React, { useEffect, useRef } from 'react';
import { TransformControls as TransformControlsImpl } from 'three-stdlib';

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
  const transformRef = useRef<TransformControlsImpl | null>(null);

  useEffect(() => {
    if (!selected || !setIsTransforming) return;
    const controls = transformRef.current;
    if (!controls) return;
    const callback = (event: { value: boolean }) => setIsTransforming(event.value);
    (controls as any).addEventListener('dragging-changed', callback);
    return () => (controls as any).removeEventListener('dragging-changed', callback);
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
