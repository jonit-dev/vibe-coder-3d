// PhysicsBox.tsx - A box with physics that integrates with our ECS
import { ReactNode } from 'react';

import { PhysicsObject, PhysicsObjectProps } from './PhysicsObject';

// Props for the PhysicsBox component
export interface PhysicsBoxProps extends Omit<PhysicsObjectProps, 'children'> {
  size?: [number, number, number]; // width, height, depth
  color?: string;
  wireframe?: boolean;
  children?: ReactNode;
}

/**
 * PhysicsBox - A box with physics that integrates with our ECS
 */
export const PhysicsBox = ({
  size = [1, 1, 1],
  color = '#fe4a49',
  wireframe = false,
  children,
  ...physicsProps
}: PhysicsBoxProps) => {
  // Default to cuboid collider if not specified
  const colliders = physicsProps.colliders || 'cuboid';

  return (
    <PhysicsObject {...physicsProps} colliders={colliders}>
      {children || (
        <mesh castShadow receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial color={color} wireframe={wireframe} />
        </mesh>
      )}
    </PhysicsObject>
  );
};
