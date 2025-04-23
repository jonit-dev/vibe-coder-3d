// PhysicsSphere.tsx - A sphere with physics that integrates with our ECS
import { ReactNode } from 'react';

import { IPhysicsObjectProps, PhysicsObject } from './PhysicsObject';

// Props for the PhysicsSphere component
export interface IPhysicsSphereProps extends Omit<IPhysicsObjectProps, 'children'> {
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
  color?: string;
  wireframe?: boolean;
  children?: ReactNode;
}

/**
 * PhysicsSphere - A sphere with physics that integrates with our ECS
 */
export const PhysicsSphere = ({
  radius = 0.5,
  widthSegments = 16,
  heightSegments = 16,
  color = '#2ab7ca',
  wireframe = false,
  children,
  ...physicsProps
}: IPhysicsSphereProps) => {
  // Default to ball collider if not specified
  const colliders = physicsProps.colliders || 'ball';

  return (
    <PhysicsObject {...physicsProps} colliders={colliders}>
      {children || (
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[radius, widthSegments, heightSegments]} />
          <meshStandardMaterial color={color} wireframe={wireframe} />
        </mesh>
      )}
    </PhysicsObject>
  );
};
