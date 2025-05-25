import { Edges } from '@react-three/drei';
import React from 'react';

export interface ISelectionOutlineProps {
  geometry: React.ReactElement;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isPlaying?: boolean;
}

export const SelectionOutline: React.FC<ISelectionOutlineProps> = React.memo(
  ({ geometry, position, rotation, scale, isPlaying = false }) => {
    // Don't show selection outline when playing
    if (isPlaying) return null;

    return (
      <mesh position={position} rotation={rotation} scale={scale}>
        {geometry}
        <meshBasicMaterial visible={false} />
        <Edges color="#ff6b35" lineWidth={2} />
      </mesh>
    );
  },
);

SelectionOutline.displayName = 'SelectionOutline';
