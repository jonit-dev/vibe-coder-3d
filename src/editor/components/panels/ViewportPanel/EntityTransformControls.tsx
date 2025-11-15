import { TransformControls } from '@react-three/drei';
import React, { useEffect, useRef } from 'react';
import { TransformControls as TransformControlsImpl } from 'three-stdlib';
import type { TransformControls as TransformControlsType } from 'three/examples/jsm/controls/TransformControls.js';

type GizmoMode = 'translate' | 'rotate' | 'scale';

interface IEntityTransformControlsProps {
  selected: boolean;
  mode: GizmoMode;
  onObjectChange?: () => void;
  setIsTransforming?: (dragging: boolean) => void;
  children: React.ReactNode;
}

export const EntityTransformControls: React.FC<IEntityTransformControlsProps> = React.memo(
  ({ selected, mode, onObjectChange, setIsTransforming, children }) => {
    const transformRef = useRef<TransformControlsImpl | null>(null);

    useEffect(() => {
      if (!selected || !setIsTransforming) return;
      const controls = transformRef.current;
      if (!controls) return;
      const callback = (event: { value: unknown }) => setIsTransforming(event.value as boolean);
      (controls as unknown as TransformControlsType).addEventListener('dragging-changed', callback);
      return () =>
        (controls as unknown as TransformControlsType).removeEventListener(
          'dragging-changed',
          callback,
        );
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
  },
);
