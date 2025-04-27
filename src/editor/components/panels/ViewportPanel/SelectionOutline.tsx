import React from 'react';

export interface ISelectionOutlineProps {
  geometry: React.ReactNode;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export const SelectionOutline: React.FC<ISelectionOutlineProps> = ({
  geometry,
  position,
  rotation,
  scale,
}) => (
  <mesh position={position} rotation={rotation} scale={scale}>
    {geometry}
    <meshBasicMaterial color="#4488ff" wireframe transparent opacity={0.5} />
  </mesh>
);
