// GameEngine Component
// The main component that sets up the R3F Canvas with the game engine
import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';

import { EngineLoop } from '@core/components/EngineLoop';
import { useGameEngine } from '@core/hooks/useGameEngine';

// Props for the GameEngine component
interface GameEngineProps {
  /** Whether to auto-start the engine on mount (default: true) */
  autoStart?: boolean;

  /** Canvas props to pass to the R3F Canvas */
  canvasProps?: React.ComponentProps<typeof Canvas>;

  /** Scene content */
  children?: React.ReactNode;
}

/**
 * Main GameEngine component
 * Wraps the R3F Canvas and manages the game engine lifecycle
 */
export function GameEngine({ autoStart = true, canvasProps, children }: GameEngineProps) {
  // Get controls from the hook
  const { startEngine, stopEngine } = useGameEngine();

  // Auto-start the engine if required
  useEffect(() => {
    if (autoStart) {
      console.log('Auto-starting game engine');
      startEngine();
    }

    // Clean up on unmount
    return () => {
      console.log('Stopping game engine');
      stopEngine();
    };
  }, [autoStart, startEngine, stopEngine]);

  return (
    <Canvas {...canvasProps}>
      {/* Core engine loop component - must be inside Canvas */}
      <EngineLoop />

      {/* Scene content */}
      {children}
    </Canvas>
  );
}
