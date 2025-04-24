import React, { FC } from 'react';

import { EntityMesh } from '@/core/components/EntityMesh';

export interface ISurfacePlaneProps {
  width: number;
  depth: number;
  position: [number, number, number];
  rotation?: [number, number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
  performance?: 'low' | 'medium' | 'high';
  children: React.ReactNode;
}

/**
 * SurfacePlane renders a flat plane surface (floor/ceiling/wall panel)
 */
const SurfacePlane: FC<ISurfacePlaneProps> = ({
  width,
  depth,
  position,
  rotation = [-Math.PI / 2, 0, 0, 1],
  castShadow = false,
  receiveShadow = false,
  performance = 'medium',
  children,
}) => (
  <EntityMesh
    position={position}
    rotation={rotation}
    castShadow={castShadow}
    receiveShadow={receiveShadow}
    performance={performance}
  >
    <planeGeometry args={[width, depth]} />
    {children}
  </EntityMesh>
);

export default SurfacePlane;
