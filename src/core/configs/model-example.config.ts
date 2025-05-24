import { validateModelConfig, type IModelConfig } from '@/core/types/assets';

/**
 * Example configuration for a character model with skeleton visualization
 * This configuration is validated using Zod schemas to ensure type safety
 */
const rawConfig = {
  scale: 1.0,
  position: [0, 0, 0] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  offset: [0, 0, 0] as [number, number, number],

  // Animation settings
  initialAnimation: 'Idle',
  animations: ['Idle', 'Walk', 'Run', 'Jump'],
  animationConfig: {
    loop: true,
    timeScale: 1.0,
    clampWhenFinished: false,
    blendDuration: 0.2,
    crossFadeEnabled: true,
  },

  // Physics settings
  physics: {
    enabled: true,
    mass: 70,
    friction: 0.5,
    restitution: 0.1,
    linearDamping: 0.9,
    angularDamping: 0.9,
    useGravity: true,
  },

  // Collision settings
  collision: {
    enabled: true,
    type: 'characterController' as const,
    shape: 'capsule' as const,
    radius: 0.3,
    height: 1.8,
    offset: [0, 0.9, 0] as [number, number, number],
    isTrigger: false,
    layer: 'character',
  },

  // GameObject settings
  gameObject: {
    tag: 'player',
    layer: 'character',
    isInteractive: true,
    isSelectable: true,
    castShadows: true,
    receiveShadows: true,
    cullingEnabled: true,
    LODLevels: [
      { distance: 0, detail: 'high' as const },
      { distance: 10, detail: 'medium' as const },
      { distance: 30, detail: 'low' as const },
    ],
  },

  // Debug visualization settings
  debugMode: {
    enabled: true, // Master toggle for all debug visualizations
    showBoundingBox: true, // Display model's bounding box
    showColliders: true, // Display collision shapes
    showSkeleton: true, // Enable skeleton visualization
    showWireframe: false, // Display model as wireframe
    showPhysicsForces: false, // Display physics forces
    showVelocity: false, // Display velocity vector
    showObjectPivot: true, // Display object pivot and axes
    debugColor: [0, 1, 0] as [number, number, number], // RGB color for debug visualizations (green)
    logToConsole: true, // Print debug info to console
  },
} as const;

// Validate the configuration using Zod schema
// This will throw an error if the configuration is invalid
export const exampleCharacterConfig: IModelConfig = validateModelConfig(rawConfig);

// Example of safe validation with error handling
export function createValidatedCharacterConfig(
  userConfig: Record<string, unknown>,
): IModelConfig | null {
  try {
    return validateModelConfig({ ...rawConfig, ...userConfig });
  } catch (error) {
    console.error('Invalid character configuration:', error);
    return null;
  }
}

// Export the raw config for testing/reference
export const rawCharacterConfig = rawConfig;
