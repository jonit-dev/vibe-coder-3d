// PhysicsSystem component - Initializes physics within a Physics context
import { ReactNode } from 'react';

import { usePhysicsSystem } from '../../lib/physics';

interface PhysicsSystemProps {
  children?: ReactNode;
}

/**
 * PhysicsSystem component
 *
 * This component must be used inside a <Physics> component from @react-three/rapier.
 * It initializes the physics system and makes it available to the rest of the application.
 */
export const PhysicsSystem = ({ children }: PhysicsSystemProps) => {
  // Initialize the physics system - this hook will access Rapier world
  usePhysicsSystem();

  // This component doesn't render anything itself
  return <>{children}</>;
};
