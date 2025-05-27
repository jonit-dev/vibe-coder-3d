import { z } from 'zod';
import React from 'react';
import { FiCamera } from 'react-icons/fi';
import { ComponentManifest, IRenderingContributions } from '../types';
import { ComponentCategory } from '@core/types/component-registry';

// Define Data Interface (CameraData)
interface CameraData {
  preset: string; // e.g., 'unity-default', 'custom'
  fov: number; // Field of View
  near: number; // Near clipping plane
  far: number; // Far clipping plane
  isMain: boolean; // Whether this is the main camera
  enableControls: boolean; // If camera controls are enabled (e.g., OrbitControls)
  target: [number, number, number]; // Target position for controls or lookAt
  projectionType: 'perspective' | 'orthographic';
  clearDepth: boolean; // Whether the camera should clear the depth buffer
  renderPriority: number; // Order of rendering for multiple cameras
}

// Define Zod Schema (CameraSchema)
const CameraSchema = z.object({
  preset: z.string().default('unity-default'),
  fov: z.number().min(1).max(179).default(30), // Typical FoV range
  near: z.number().positive().default(0.1),
  far: z.number().positive().default(1000), // Increased default far plane
  isMain: z.boolean().default(false),
  enableControls: z.boolean().default(true),
  target: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  projectionType: z.enum(['perspective', 'orthographic']).default('perspective'),
  clearDepth: z.boolean().default(true),
  renderPriority: z.number().int().default(0),
});

// Create Manifest
const cameraManifest: ComponentManifest<CameraData> = {
  id: 'Camera', // From old KnownComponentTypes.CAMERA
  name: 'Camera',
  category: ComponentCategory.Rendering,
  description: 'Provides a viewpoint for rendering the scene.',
  icon: React.createElement(FiCamera, { className: 'w-4 h-4' }),
  schema: CameraSchema,
  getDefaultData: () => CameraSchema.parse({}),
  getRenderingContributions: (data: CameraData): IRenderingContributions => {
    // Logic adapted from old ComponentRegistry.ts
    // The old registry returned a specific meshType: 'Camera' which might be for editor visualization
    // and set visible, castShadow, receiveShadow.
    // The actual camera behavior (fov, near, far, etc.) is handled by the CameraSystem/GameCameraManager
    // using the component's data directly, not typically through rendering contributions of this shape.
    // This contribution is more about how the camera *entity itself* might be visualized in the editor.
    return {
      meshType: 'CameraGizmo', // Suggesting a more specific name for editor visualization
      visible: true, // The gizmo itself should be visible in editor
      castShadow: false, // Gizmos typically don't cast shadows
      receiveShadow: false, // Gizmos typically don't receive shadows
      // Other properties like FoV, near, far from `data` will be used by the camera system itself.
    };
  },
  removable: false, // Cameras are often core scene elements, though this can be true if desired
};

export default cameraManifest;
