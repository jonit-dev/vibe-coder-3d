/**
 * usePhysicsBinding - Hook to wire physics mutations to Rapier world
 * Should be called in a component that has access to Rapier context (e.g., inside Physics wrapper)
 */

import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import {
  processPhysicsMutations,
  syncVelocitiesFromRapier,
} from '@/core/lib/scripting/adapters/physics-binding';
import { DirectScriptExecutor } from '@/core/lib/scripting/DirectScriptExecutor';

/**
 * Hook that processes physics mutations from the mutation buffer
 * Should be used inside a component wrapped by <Physics> from @react-three/rapier
 */
export function usePhysicsBinding() {
  const { world } = useRapier();
  const scriptExecutor = DirectScriptExecutor.getInstance();
  const mutationBuffer = scriptExecutor.getMutationBuffer();

  useFrame(() => {
    // Process physics mutations before physics step
    // This applies forces, impulses, and velocity changes from scripts
    processPhysicsMutations(mutationBuffer, world);

    // Sync velocities back to ECS after physics step
    // This allows scripts to read current velocities via getLinearVelocity/getAngularVelocity
    syncVelocitiesFromRapier();
  });
}
