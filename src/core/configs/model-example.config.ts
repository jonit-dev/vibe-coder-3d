import { IModelConfig } from '@/core/types/assets';

/**
 * Example configuration for a character model with skeleton visualization
 */
export const exampleCharacterConfig: IModelConfig = {
  scale: 1.0,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  offset: [0, 0, 0],

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
    type: 'characterController',
    shape: 'capsule',
    radius: 0.3,
    height: 1.8,
    offset: [0, 0.9, 0],
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
      { distance: 0, detail: 'high' },
      { distance: 10, detail: 'medium' },
      { distance: 30, detail: 'low' },
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
    debugColor: [0, 1, 0], // RGB color for debug visualizations (green)
    logToConsole: true, // Print debug info to console
  },
};
