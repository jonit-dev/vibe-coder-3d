import React from 'react';

export interface ISelectionOutlineProps {
  geometry: React.ReactNode;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  key?: React.Key;
}

export const SelectionOutline: React.FC<ISelectionOutlineProps> = ({
  geometry,
  position,
  rotation,
  scale,
  key,
}) => (
  <mesh position={position} rotation={rotation} scale={scale} key={key}>
    {geometry}
    <meshBasicMaterial color="#4488ff" wireframe transparent opacity={0.5} />
  </mesh>
);
