import { z } from 'zod';

import { ComponentCategory, IComponentDescriptor } from '../types';

// Additional component definitions that can be added in the future

// Health Component (for gameplay)
export const healthDescriptor: IComponentDescriptor = {
  id: 'health',
  name: 'Health',
  category: ComponentCategory.Gameplay,
  component: null, // Would need to be implemented in bitECS
  schema: z.object({
    current: z.number().min(0).default(100),
    maximum: z.number().min(1).default(100),
    regeneration: z.number().min(0).default(0),
    invulnerable: z.boolean().default(false),
  }),
  serialize: (_entityId: number) => {
    // Implementation needed
    return null;
  },
  deserialize: (_entityId: number, _data: any) => {
    // Implementation needed
  },
  metadata: {
    description: 'Health and damage system for entities',
    version: '1.0.0',
  },
};

// Audio Source Component
export const audioSourceDescriptor: IComponentDescriptor = {
  id: 'audioSource',
  name: 'Audio Source',
  category: ComponentCategory.Audio,
  component: null, // Would need to be implemented
  dependencies: ['transform'],
  schema: z.object({
    enabled: z.boolean().default(true),
    clip: z.string().optional(),
    volume: z.number().min(0).max(1).default(1),
    pitch: z.number().min(0.1).max(3).default(1),
    loop: z.boolean().default(false),
    autoPlay: z.boolean().default(false),
    spatialBlend: z.number().min(0).max(1).default(1), // 0 = 2D, 1 = 3D
    minDistance: z.number().min(0).default(1),
    maxDistance: z.number().min(0).default(500),
  }),
  serialize: (_entityId: number) => {
    // Implementation needed
    return null;
  },
  deserialize: (_entityId: number, _data: any) => {
    // Implementation needed
  },
  metadata: {
    description: '3D positional audio source',
    version: '1.0.0',
  },
};

// AI Agent Component
export const aiAgentDescriptor: IComponentDescriptor = {
  id: 'aiAgent',
  name: 'AI Agent',
  category: ComponentCategory.AI,
  component: null, // Would need to be implemented
  dependencies: ['transform'],
  schema: z.object({
    enabled: z.boolean().default(true),
    behaviorTree: z.string().optional(),
    state: z.string().default('idle'),
    targetEntity: z.number().optional(),
    speed: z.number().min(0).default(5),
    detectionRadius: z.number().min(0).default(10),
    aggroRadius: z.number().min(0).default(15),
  }),
  serialize: (_entityId: number) => {
    // Implementation needed
    return null;
  },
  deserialize: (_entityId: number, _data: any) => {
    // Implementation needed
  },
  metadata: {
    description: 'AI behavior and decision making',
    version: '1.0.0',
  },
};

// Network Sync Component
export const networkSyncDescriptor: IComponentDescriptor = {
  id: 'networkSync',
  name: 'Network Sync',
  category: ComponentCategory.Network,
  component: null, // Would need to be implemented
  dependencies: ['transform'],
  schema: z.object({
    enabled: z.boolean().default(true),
    authority: z.enum(['server', 'client', 'shared']).default('server'),
    syncPosition: z.boolean().default(true),
    syncRotation: z.boolean().default(true),
    syncScale: z.boolean().default(false),
    updateRate: z.number().min(1).max(60).default(20),
    interpolation: z.boolean().default(true),
  }),
  serialize: (_entityId: number) => {
    // Implementation needed
    return null;
  },
  deserialize: (_entityId: number, _data: any) => {
    // Implementation needed
  },
  metadata: {
    description: 'Network synchronization for multiplayer',
    version: '1.0.0',
  },
};

// Light Component
export const lightDescriptor: IComponentDescriptor = {
  id: 'light',
  name: 'Light',
  category: ComponentCategory.Rendering,
  component: null, // Would need to be implemented
  dependencies: ['transform'],
  schema: z.object({
    enabled: z.boolean().default(true),
    type: z.enum(['directional', 'point', 'spot']).default('point'),
    color: z.tuple([z.number(), z.number(), z.number()]).default([1, 1, 1]),
    intensity: z.number().min(0).default(1),
    range: z.number().min(0).default(10),
    spotAngle: z.number().min(0).max(180).default(30),
    castShadows: z.boolean().default(true),
  }),
  serialize: (_entityId: number) => {
    // Implementation needed
    return null;
  },
  deserialize: (_entityId: number, _data: any) => {
    // Implementation needed
  },
  metadata: {
    description: 'Light source for scene illumination',
    version: '1.0.0',
  },
};

// Collection of additional component descriptors
export const ADDITIONAL_COMPONENTS: IComponentDescriptor[] = [
  healthDescriptor,
  audioSourceDescriptor,
  aiAgentDescriptor,
  networkSyncDescriptor,
  lightDescriptor,
];

// Registration function for additional components
export function registerAdditionalComponents(registry: any): void {
  for (const descriptor of ADDITIONAL_COMPONENTS) {
    registry.registerComponent(descriptor);
  }
}
