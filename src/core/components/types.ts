import { z } from 'zod';
import React from 'react';
import { ComponentCategory } from '@core/types/component-registry'; // Ensure this path is correct

export interface IRenderingContributions {
  geometry?: React.ReactNode;
  material?: {
    color?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
  };
  visible?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  meshType?: string;
}

export interface IPhysicsContributions {
  colliders?: React.ReactNode[];
  rigidBodyProps?: {
    type?: string;
    mass?: number;
    friction?: number;
    restitution?: number;
    density?: number;
    gravityScale?: number;
    canSleep?: boolean;
  };
  enabled?: boolean;
}

export interface ComponentManifest<TData = any> {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  icon: React.ReactNode;
  schema: z.ZodSchema<TData>;
  getDefaultData: () => TData;
  getRenderingContributions?: (data: TData) => IRenderingContributions;
  getPhysicsContributions?: (data: TData) => IPhysicsContributions;
  onAdd?: (entityId: number, data: TData) => void;
  onRemove?: (entityId: number) => void;
  removable?: boolean;
  dependencies?: string[];
  conflicts?: string[];
}

// Component pack definition (moved from old ComponentRegistry.ts)
export interface IComponentPack {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode; // Should be React.ReactNode for consistency with ComponentManifest
  components: string[]; // Array of component IDs
  category: ComponentCategory; // Use ComponentCategory enum
}
