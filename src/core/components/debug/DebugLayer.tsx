import { Stats } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { useControls } from 'leva';
import { ReactNode, useMemo } from 'react';

interface DebugLayerProps {
  children: ReactNode;
  defaultPhysics?: boolean;
  defaultStats?: boolean;
  defaultWireframe?: boolean;
}

/**
 * Wraps content with debugging tools that can be toggled at runtime
 */
export function DebugLayer({
  children,
  defaultPhysics = false,
  defaultStats = false,
  defaultWireframe = false,
}: DebugLayerProps) {
  // Debug controls with leva
  const { showPhysics, showStats, showWireframe } = useControls('Debug', {
    showPhysics: { value: defaultPhysics, label: 'Physics' },
    showStats: { value: defaultStats, label: 'Stats' },
    showWireframe: { value: defaultWireframe, label: 'Wireframe' },
  });

  // Prepare physics debug wrapper component only when needed
  const PhysicsDebugWrapper = useMemo(
    () => (props: { children: ReactNode }) => {
      return <Physics debug={showPhysics}>{props.children}</Physics>;
    },
    [showPhysics],
  );

  return (
    <>
      {/* Performance stats */}
      {showStats && <Stats />}

      {/* Physics debug visualization */}
      <PhysicsDebugWrapper>
        {/* Apply wireframe to scene if enabled */}
        <group userData={{ wireframe: showWireframe }}>{children}</group>
      </PhysicsDebugWrapper>
    </>
  );
}
