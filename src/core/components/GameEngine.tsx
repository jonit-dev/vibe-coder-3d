// GameEngine Component
// The main component that sets up the R3F Canvas with the game engine
import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import { z } from 'zod';

import { EngineLoop } from '@core/components/EngineLoop';
import type { IEngineConfig } from '@core/configs/EngineConfig';
import { useGameEngineControls } from '@core/hooks/useGameEngineControls';

// Zod schema for GameEngine component props
export const GameEnginePropsSchema = z.object({
  autoStart: z.boolean().default(true),
  canvasProps: z.record(z.unknown()).optional(), // React.ComponentProps<typeof Canvas>
  noCanvas: z.boolean().default(false),
  engineConfig: z.record(z.unknown()).optional(),
  children: z.any().optional(), // React.ReactNode
});

// Props for the GameEngine component
export interface IGameEngineProps {
  /** Whether to auto-start the engine on mount (default: true) */
  autoStart?: boolean;

  /** Canvas props to pass to the R3F Canvas */
  canvasProps?: React.ComponentProps<typeof Canvas>;

  /** Skip Canvas wrapping when used inside an existing Canvas (default: false) */
  noCanvas?: boolean;

  /** Engine configuration */
  engineConfig?: Partial<IEngineConfig>;

  /** Scene content */
  children?: React.ReactNode;
}

// Validation helper
export const validateGameEngineProps = (props: unknown) => GameEnginePropsSchema.parse(props);

/**
 * Main GameEngine component
 * Wraps the R3F Canvas and manages the game engine lifecycle
 */
export function GameEngine({
  autoStart = true,
  canvasProps,
  noCanvas = false,
  engineConfig: _engineConfig,
  children,
}: IGameEngineProps) {
  // Get controls from the hook
  const { startEngine, stopEngine } = useGameEngineControls();

  // Auto-start the engine if required
  useEffect(() => {
    if (autoStart) {
      startEngine();
    }

    // Clean up on unmount
    return () => {
      stopEngine();
    };
  }, [autoStart, startEngine, stopEngine]);

  // If noCanvas is true, skip Canvas wrapping
  if (noCanvas) {
    return (
      <>
        {/* Core engine loop component */}
        <EngineLoop />

        {/* Scene content */}
        {children}
      </>
    );
  }

  // Wrap with standard Canvas (WebGL)
  return (
    <Canvas {...canvasProps} frameloop="demand">
      {/* Core engine loop component - must be inside Canvas */}
      <EngineLoop />

      {/* Scene content */}
      {children}
    </Canvas>
  );
}
