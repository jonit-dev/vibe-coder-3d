import { TransformControls } from '@react-three/drei';
import React, { useEffect, useRef } from 'react';

type GizmoMode = 'translate' | 'rotate' | 'scale';

interface IEntityTransformControlsProps {
  selected: boolean;
  mode: GizmoMode;
  onObjectChange?: () => void;
  setIsTransforming?: (dragging: boolean) => void;
  children: React.ReactNode;
}

const EntityTransformControls: React.FC<IEntityTransformControlsProps> = ({
  selected,
  mode,
  onObjectChange,
  setIsTransforming,
  children,
}) => {
  const transformRef = useRef<any>(null);

  useEffect(() => {
    if (!selected || !setIsTransforming) return;
    const controls = transformRef.current;
    if (!controls) return;
    const callback = (event: any) => setIsTransforming(event.value);
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

export default EntityTransformControls;
